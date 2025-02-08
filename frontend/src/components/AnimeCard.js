import React from 'react';
import { Link } from 'react-router-dom';

const AnimeCard = ({ anime }) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <Link to={`/anime/${anime.mal_id}`}>
        <img src={anime.image_url} alt={anime.title_english} className="w-full h-48 object-cover" />
      </Link>
      <div className="p-4">
        <h2 className="text-xl font-bold mb-2">
          <Link to={`/anime/${anime.mal_id}`}>{anime.title_english}</Link>
        </h2>
        <p className="text-gray-700 text-sm">
          {anime.synopsis ? anime.synopsis.substring(0, 100) + '...' : 'No synopsis available'}
        </p>
        {anime.season && (
          <div className="mt-2">
            <span className="text-sm font-medium text-blue-600">{anime.season}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnimeCard;
