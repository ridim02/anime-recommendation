import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import LoadingSpinner from '../components/LoadingSpinner';

const AnimeDetailsPage = () => {
  const { id } = useParams();
  const [anime, setAnime] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`http://localhost:3001/anime/${id}`)
      .then(response => {
        setAnime(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching anime details:', error);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!anime) {
    return <div className="container mx-auto px-4 py-6">Anime not found.</div>;
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row">
        <img src={anime.image_url} alt={anime.title_english} className="w-full md:w-1/3 object-cover rounded-lg" />
        <div className="md:ml-6 mt-4 md:mt-0">
          <h1 className="text-3xl font-bold">{anime.title_english}</h1>
          <p className="mt-4 text-gray-700">{anime.synopsis}</p>
          <p className="mt-4">
            <span className="font-semibold">Status:</span> {anime.status}
          </p>
          <p className="mt-2">
            <span className="font-semibold">Season:</span> {anime.season}
          </p>
          {anime.genre && (
            <div className="mt-4">
              <h2 className="text-xl font-semibold">Genres:</h2>
              <div className="flex flex-wrap mt-2">
                {anime.genre.map(g => (
                  <span key={g.mal_id} className="mr-2 mb-2 px-2 py-1 bg-blue-200 text-blue-800 rounded-full text-sm">
                    {g.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnimeDetailsPage;
