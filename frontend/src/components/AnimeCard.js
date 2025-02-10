import React from "react";
import { Link } from "react-router-dom";

const AnimeCard = ({ anime }) => {
  const imageUrl = anime.images?.jpg?.image_url || anime.image_url || "";
  const title = anime.title_english || anime.title;

  return (
    <div className="bg-primary text-white rounded-lg shadow-lg overflow-hidden w-64 h-120 p-3 transform transition duration-300 hover:scale-105 pb-15">
      <div className="relative h-40">
        <img src={imageUrl} alt={title} className="w-full h-full object-cover rounded-lg" />
        <div className="absolute top-2 left-2 bg-secondary text-xs px-2 py-1 rounded-md font-semibold text-white"> {anime.status}</div>
      </div>

      <div className="p-3 flex flex-col justify-between">
        <p className="text-sm text-highlight">
          {anime.season} {anime.year} • {anime.episodes} episodes
        </p>

        <h3 className="text-lg font-bold mt-1">
          <Link to={`/anime/${anime.mal_id}`} className="hover:underline"> {title} </Link>
        </h3>

        <div className="flex items-center justify-between mt-2 text-white">
          <p className="text-sm">
            ⭐ {anime.score} <span className="text-xs">({anime.members} users)</span>
          </p>
          <p className="text-sm">#{anime.rank} Ranking</p>
        </div>

        <div className="flex gap-2 mt-2 flex-wrap">
          {anime.genres?.slice(0, 2).map((genre, index) => (
            <span key={index} className="bg-accent px-2 py-1 text-xs rounded-md text-white">
              {genre.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnimeCard;
