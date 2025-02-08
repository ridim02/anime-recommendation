const express = require('express');
const axios = require('axios');
const cors = require('cors');
const rateLimit = require('axios-rate-limit');
const NodeCache = require('node-cache');

const cache = new NodeCache({ stdTTL: 3600 });

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());

const JIKAN_API_BASE = 'https://api.jikan.moe/v4/anime';
const FASTAPI_BASE = 'http://localhost:8000';

const popular_animes = await axios.get(`${JIKAN_API_BASE}/top/anime`);
console.log(popular_animes);

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
// const arr = {
//     anime_ids: [
//       14347,  8247, 14397, 41022, 36946, 10330,
//       28805, 16664, 41278, 14837, 37384,  2724,
//       17121,  4835, 31490,  6951, 25389, 27539,
//       11177,  1047,  1092, 25781, 27857, 13629,
//        9544, 38290, 32287, 30381, 11977, 11979,
//       11981, 30711, 20509,  2211,   523, 12879,
//       35788,   985, 32233, 32282, 29067,   859,
//       34240, 30458, 28497
//     ],
//     user_ids: [ 223779, 231531, 39558, 351383, 325551 ]
// }
// console.log(arr.anime_ids);
// const animeDetails = async () =>{

//  await processInBatches(arr.anime_ids, 3, 1000,
//             async (animeId) => {
//                 console.log(animeId)
//                 try {
//                     const detailsResponse = await axios.get(`${JIKAN_API_BASE}/${animeId}`);
//                     const animeData = detailsResponse.data.data;
//                     console.log(animeData)
//                     return {
//                         mal_id: animeData.mal_id,
//                         title_english: animeData.title_english || animeData.title,
//                         synopsis: animeData.synopsis,
//                         status: animeData.status,
//                         image_url: animeData.images?.jpg?.image_url
//                     };
//                 } catch (error) {
//                     console.error(`Error fetching details for anime ID ${animeId}:`, error.message);
//                     return null;
//                 }
//             }
//         );
//     }
// console.log(animeDetails)
app.get('/anime/:id', async (req, res) => {
    try {
        const animeId = req.params.id;
        
        const response = await axios.get(`${JIKAN_API_BASE}/${animeId}`);
        
        const animeData = response.data.data;
        const result = {
            mal_id: animeData.mal_id,
            title_english: animeData.title_english || animeData.title,
            synopsis: animeData.synopsis,
            status: animeData.status,
            image_url: animeData.images?.jpg?.image_url,
            season: animeData.season,
            genre: animeData.genres,
            links: animeData.streaming
        };

        res.json(result);
    } catch (error) {
        console.error('Error fetching anime data:', error.message);
        
        if (error.response?.status === 404) {
            return res.status(404).json({ error: 'Anime not found' });
        }
        
        res.status(500).json({ error: 'Failed to fetch anime data' });
    }
});
app.get('/anime/:id/pictures', async (req, res) => {
    try {
        const animeId = req.params.id;
        
        const response = await axios.get(`${JIKAN_API_BASE}/${animeId}/pictures`);
        
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

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});