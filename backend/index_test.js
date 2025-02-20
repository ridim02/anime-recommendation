const express = require('express');
const axios = require('axios');
const cors = require('cors');
const rateLimit = require('axios-rate-limit');
const NodeCache = require('node-cache');
const session = require('express-session');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const users = require('./models/users');

const app = express();
const port = process.env.PORT || 3001;
const cache = new NodeCache({ stdTTL: 3600 });

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  session({
    secret: "anime-recommendations",
    resave: false,
    saveUninitialized: true,
  })
);

// Connect to MongoDB
mongoose
  .connect("mongodb://localhost:27017/anime-recommendation", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

const JIKAN_API_BASE = 'https://api.jikan.moe/v4/anime';
const FASTAPI_BASE = 'http://localhost:8000';
const jikanApi = rateLimit(axios.create(), { 
  maxRequests: 3,
  perMilliseconds: 1000
});

async function fetchWithRetry(animeId, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await jikanApi.get(`${JIKAN_API_BASE}/${animeId}/full`);
      return response.data.data;
    } catch (error) {
      if (error.response?.status === 429) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      } else {
        throw error;
      }
    }
  }
  return null;
}

async function getAnimeDetails(animeId) {
  try {
    const cached = cache.get(animeId);
    if (cached) return cached;
  
    const data = await fetchWithRetry(animeId);
    if (data) {
      const result = {
        mal_id: data.mal_id,
        title_english: data.title_english || data.title,
        synopsis: data.synopsis,
        status: data.status,
        image_url: data.images?.jpg?.image_url,
        title: data.title,
        season: data.season,
        year: data.year,
        score: data.score,
        episodes: data.episodes,
        members: data.members,
        rank: data.rank,
        genres: data.genres,
        external: data.external,
        streaming: data.streaming
      };
      cache.set(animeId, result);
      return result;
    }
  } catch (error) {
    console.log(`Error: ${error}`);
  }
  return null;
}

async function processInBatches(items, batchSize, delayMs) {
  const results = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(async animeId => {
        try {
          return await getAnimeDetails(animeId);
        } catch (error) {
          console.error(`Error processing anime ${animeId}:`, error.message);
          return null;
        }
      })
    );
    results.push(...batchResults);
    if (i + batchSize < items.length) await new Promise(resolve => setTimeout(resolve, delayMs));
  }
  return results.filter(item => item !== null);
}

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await users.findOne({ username: username });
    if (!user || user.password !== password) {
      return res.status(401).json({ error: "Invalid username or password" });
    }
    req.session.userId = user.user_id;
    res.json({
      userId: user.user_id,
      username: user.username,
      mal_id: user.mal_id,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get('/anime/:id', async (req, res) => {
  try {
    const animeId = req.params.id;
    const result = await getAnimeDetails(animeId);
    result
      ? res.json(result)
      : res.status(404).json({ error: 'Anime not found' });
  } catch (error) {
    error.response?.status === 404 
      ? res.status(404).json({ error: 'Anime not found' })
      : res.status(500).json({ error: 'Failed to fetch anime data' });
  }
});

app.get('/anime-by-name/:name', async (req, res) => {
  try {
    const response = await axios.get(`${FASTAPI_BASE}${req.originalUrl}`);
    const animeDetails = await processInBatches(response.data, 3, 1000);
    animeDetails
      ? res.json(animeDetails)
      : res.status(404).json({ error: 'Anime not found' });
  } catch (error) {
    error.response?.status === 404 
      ? res.status(404).json({ error: 'Anime not found: ' + error })
      : res.status(500).json({ error: 'Failed to fetch anime data: ' + error});
  }
});

app.get('/recommendations/:user_id', async (req, res) => {
  try {
    const userId = req.params.user_id;
    const response = await axios.get(`${FASTAPI_BASE}/user/get-recommendations/${userId}/10`);
    const animeDetails = await processInBatches(response.data, 3, 1000);
    res.json(animeDetails);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
});

app.get('/popular-animes', async (req, res) => {
  try {
    const response = await axios.get('https://api.jikan.moe/v4/top/anime');
    res.json(response.data.data.slice(0,9));
  } catch (error) {
    res.status(500).json({ error: `Failed to fetch popular-animes: ${error}` });
  }
});

app.get('/group/random/recommendations', async (req, res) => {
  try {
    const response = await axios.get(`${FASTAPI_BASE}${req.originalUrl}`);
    console.log(response);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch recommendations for group: ' + error });
  }
});

app.get('/user/similar-anime/:name', async (req, res) => {
  try {
    const response = await axios.get(`${FASTAPI_BASE}${req.originalUrl}`);
    const animeDetails = await processInBatches(response.data, 3, 1000);
    res.json(animeDetails);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
});

[
  '/user/preferences/:user_id',
  '/user/similar-users/:user_id'
].forEach(endpoint => {
  const [path] = endpoint.split(':');
  app.get(endpoint, async (req, res) => {
    try {
      const response = await axios.get(`${FASTAPI_BASE}${req.originalUrl}`);
      res.json(response.data);
    } catch (error) {
      res.status(500).json({ error: `Failed to fetch ${path} data: ${error}` });
    }
  });
});

app.get("/anime-by-genre/:genre/:user_id", async (req, res) => {
  try{
    const userId = req.params.user_id;
    const response = await axios.get(`${FASTAPI_BASE}${req.originalUrl}`);
    const animeDetails = await processInBatches(response.data, 3, 1000);
    res.json(animeDetails);
  }
  catch (error){
    res.status(500).json({error: `Failed to fetch: ${error}`});
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
