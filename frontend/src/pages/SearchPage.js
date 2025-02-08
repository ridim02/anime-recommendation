import React, { useState } from 'react';
import axios from 'axios';
import AnimeCard from '../components/AnimeCard';
import LoadingSpinner from '../components/LoadingSpinner';

const SearchPage = () => {
  const [query, setQuery] = useState('');
  const [animeResults, setAnimeResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    axios.get(`http://localhost:3001/user/similar-anime/${encodeURIComponent(query)}`)
      .then(response => {
        setAnimeResults(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error searching for anime:', error);
        setLoading(false);
      });
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex">
          <input
            type="text"
            placeholder="Search for anime..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-grow border border-gray-300 rounded-l-lg p-2 focus:outline-none"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 rounded-r-lg hover:bg-blue-700"
          >
            Search
          </button>
        </div>
      </form>
      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {animeResults.map(anime => (
            <AnimeCard key={anime.mal_id} anime={anime} />
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchPage;
