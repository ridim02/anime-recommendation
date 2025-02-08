const express = require('express');
const axios = require('axios');
const cors = require('cors');
const rateLimit = require('axios-rate-limit');
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 3600 });

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());

const JIKAN_API_BASE = 'https://api.jikan.moe/v4/anime';
const FASTAPI_BASE = 'http://localhost:8000';

const jikanApi = rateLimit(axios.create(), {
  maxRequests: 3,
  perMilliseconds: 1000,
});

async function processInBatches(items, batchSize, delayMs, processItem) {
    const results = [];
    for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        const batchResults = await Promise.all(
            batch.map(item => processItem(item))
        );
        results.push(...batchResults);
        
        // Add delay after every batch except the last one
        if (i + batchSize < items.length) {
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }
    }
    return results;
}

app.get('/anime/:id', async (req, res) => {
    try {
        const animeId = req.params.id;
        const response = await jikanApi.get(`${JIKAN_API_BASE}/${animeId}`);
        const animeData = response.data.data;

        res.json(animeData);
    } catch (error) {
        console.error('Error fetching anime data:', error.message);
        
        if (error.response?.status === 404) {
            return res.status(404).json({ error: 'Anime not found' });
        }
        
        res.status(500).json({ error: 'Failed to fetch anime data' });
    }
});

app.get('/similar-anime/:name', async (req, res) => {
    try {
        const animeName = req.params.name;
          const recommendationsResponse = Number(animeName) ? 
            await axios.get(`${FASTAPI_BASE}/user/similar-anime/${animeName}`) 
            : await axios.get(`${FASTAPI_BASE}/user/similar-animebyname/${animeName}`);
        const animeDetails = await getAnimeDetailsAsync(recommendationsResponse);
        res.json(animeDetails);
    } catch (error) {
        console.error('Error fetching similar anime:', error.message);
        res.status(500).json({ error: 'Failed to fetch similar anime' });
    }
});

app.get('/recommendations/:user_id', async (req, res) => {
    try {
        const userId = req.params.user_id;
        
        const recommendationsResponse = await axios.get(`${FASTAPI_BASE}/user/get-recommendations/${userId}/10`);
        const animeIds = recommendationsResponse.data;

        const animeDetails = await processInBatches(animeIds, 3, 1000,
            async (animeId) => {
                try {
                    const detailsResponse = await axios.get(`${JIKAN_API_BASE}/${animeId}`);
                    const animeData = detailsResponse.data.data;
                    return {
                        mal_id: animeData.mal_id,
                        title_english: animeData.title_english || animeData.title,
                        synopsis: animeData.synopsis,
                        status: animeData.status,
                        image_url: animeData.images?.jpg?.image_url
                    };
                } catch (error) {
                    console.error(`Error fetching details for anime ID ${animeId}:`, error.message);
                    return null;
                }
            }
        );
  
        const filteredAnimeDetails = animeDetails.filter(anime => anime !== null);
  
        res.json(filteredAnimeDetails);
    } catch (error) {
        console.error('Error fetching recommendations:', error.message);
        res.status(500).json({ error: 'Failed to fetch recommendations' });
    }
  });

app.get('/highly-rated/:user_id', async (req, res) => {
    try {
        const userId = req.params.user_id;
        
        const response = await axios.get(`${FASTAPI_BASE}/user/highly-rated/${userId}`);
        
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching highly rated anime:', error.message);
        res.status(500).json({ error: 'Failed to fetch highly rated anime' });
    }
});

app.get('/similar-users/:user_id', async (req, res) => {
    try {
        const userId = req.params.user_id;
        
        const response = await axios.get(`${FASTAPI_BASE}/user/similar-users/${userId}`);
        
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching similar users:', error.message);
        res.status(500).json({ error: 'Failed to fetch similar users' });
    }
});

app.get('/group-recommendations', async (req, res) => {
    try {
        const response = await axios.get(`${FASTAPI_BASE}/group/random/recommendations`);
        console.log(response.data);
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching group recommendations:', error.message);
        res.status(500).json({ error: 'Failed to fetch group recommendations' });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});