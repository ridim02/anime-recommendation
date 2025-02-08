import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AnimeCard from '../components/AnimeCard';
import LoadingSpinner from '../components/LoadingSpinner';

const HomePage = () => {
  const [recommendedAnime, setRecommendedAnime] = useState([]);
  const [popularAnime, setPopularAnime] = useState([]);
  const [loadingRec, setLoadingRec] = useState(true);
  const [loadingPop, setLoadingPop] = useState(true);

  // Hardcoded user ID for demo purposes
  const userId = 105315;

  useEffect(() => {
    // Fetch recommended anime for the user
    axios.get(`http://localhost:3001/recommendations/${userId}`)
      .then(response => {
        setRecommendedAnime(response.data);
        setLoadingRec(false);
      })
      .catch(error => {
        console.error('Error fetching recommended anime:', error);
        setLoadingRec(false);
      });
    
    // Fetch popular anime
    axios.get('http://localhost:3001/popular_animes')
      .then(response => {
        // response.data is expected to be an array of anime IDs
        const animeIds = response.data;
        // Fetch details for each anime id
        Promise.all(
          animeIds.map(id => 
            axios.get(`http://localhost:3001/anime/${id}`).then(res => res.data)
          )
        )
        .then(animeDetails => {
          setPopularAnime(animeDetails);
          setLoadingPop(false);
        })
        .catch(error => {
          console.error('Error fetching popular anime details:', error);
          setLoadingPop(false);
        });
      })
      .catch(error => {
        console.error('Error fetching popular anime:', error);
        setLoadingPop(false);
      });
  }, [userId]);

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold mb-4">Welcome to AnimeRec</h1>
      
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Recommended Anime</h2>
        {loadingRec ? (
          <LoadingSpinner />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {recommendedAnime.map(anime => (
              <AnimeCard key={anime.mal_id} anime={anime} />
            ))}
          </div>
        )}
      </section>
      
      <section>
        <h2 className="text-2xl font-semibold mb-4">Popular Anime</h2>
        {loadingPop ? (
          <LoadingSpinner />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {popularAnime.map(anime => (
              <AnimeCard key={anime.mal_id} anime={anime} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default HomePage;
