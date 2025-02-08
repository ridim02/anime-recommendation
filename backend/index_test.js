const express = require('express');
const axios = require('axios');
const cors = require('cors');
const rateLimit = require('axios-rate-limit');
const NodeCache = require('node-cache');

const app = express();
const port = process.env.PORT || 3001;
const cache = new NodeCache({ stdTTL: 3600 });

app.use(cors());

const JIKAN_API_BASE = 'https://api.jikan.moe/v4/anime';
const FASTAPI_BASE = 'http://localhost:8000';

const jikanApi = rateLimit(axios.create(), { 
  maxRequests: 3,
  perMilliseconds: 1000
});

async function fetchWithRetry(animeId, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await jikanApi.get(`https://api.jikan.moe/v4/anime/${animeId}`);
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
      season: data.season,
      genre: data.genres,
      links: data.streaming,
      score: data.score
    };
    cache.set(animeId, result);
    return result;
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

app.get('/anime/:id', async (req, res) => {
  try {
    const animeId = req.params.id;
    const result = await getAnimeDetails(animeId);
    result ? res.json(result) : res.status(404).json({ error: 'Anime not found' });
  } catch (error) {
    error.response?.status === 404 
      ? res.status(404).json({ error: 'Anime not found' })
      : res.status(500).json({ error: 'Failed to fetch anime data' });
  }
});

app.get('/recommendations/:user_id', async (req, res) => {
  try {
    const userId = req.params.user_id;
    const response = await axios.get(`${FASTAPI_BASE}/user/get-recommendations/${userId}/21`);
    console.log(response.data)
    const animeDetails = await processInBatches(response.data, 3, 1000);
    res.json(animeDetails);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
});

app.get('/popular-animes', async (req,res)=>{
  try{
    const response = await axios.get('https://api.jikan.moe/v4/top/anime');
    res.json(response.data.data);
  }
  catch (error) {
    res.status(500).json({ error: `Failed to fetch popular-animes: ${error}` });
  }
})

app.get('/group/random/recommendations', async (req, res) => {
    try {
      const response = await axios.get(`${FASTAPI_BASE}${req.originalUrl}`);
      const animeDetails = await processInBatches(response.data.anime_ids, 3, 1000);
      res.json(animeDetails);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch recommendations' });
    }
  });  

  app.get('/user/similar-anime/:name', async (req, res) => {
      try {
        const response = await axios.get(`${FASTAPI_BASE}${req.originalUrl}`);
        const animeDetails = await processInBatches(response.data, 3, 1000);
        console.log(animeDetails)
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
        console.log(req.originalUrl)
      const response = await axios.get(`${FASTAPI_BASE}${req.originalUrl}`);
      res.json(response.data);
    } catch (error) {
      res.status(500).json({ error: `Failed to fetch ${path} data: ${error}` });
    }
  });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});