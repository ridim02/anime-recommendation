import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AnimeCard from '../components/AnimeCard';
import LoadingSpinner from '../components/LoadingSpinner';

const GroupRecommendationsPage = () => {
  const [groupAnime, setGroupAnime] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('http://localhost:3001/group/random/recommendations')
      .then(response => {get-recommendations
        // Assume response.data.anime_ids is an array of anime IDs
        const animeIds = response.data.anime_ids;
        console.log(animeIds)
        Promise.all(
          animeIds.map(id =>
            axios.get(`http://localhost:3001/anime/${id}`).then(res => res.data)
          )
        )
        .then(animeDetails => {
          setGroupAnime(animeDetails);
          setLoading(false);
        })
        .catch(error => {
          console.error('Error fetching group anime details:', error);
          setLoading(false);
        });
      })
      .catch(error => {
        console.error('Error fetching group recommendations:', error);
        setLoading(false);
      });
  }, []);

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold mb-6">Group Recommendations</h1>
      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {groupAnime.map(anime => (
            <AnimeCard key={anime.mal_id} anime={anime} />
          ))}
        </div>
      )}
    </div>
  );
};

export default GroupRecommendationsPage;
