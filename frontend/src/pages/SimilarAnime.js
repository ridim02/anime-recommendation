import { useEffect, useState } from "react";
import axios from "axios";

const SimilarAnime = () => {
  const [animeList, setAnimeList] = useState([]);
  const animeName = "Attack on Titan"; // Change dynamically as needed

  useEffect(() => {
    axios.get(`http://localhost:3001/user/similar-anime/${animeName}`)
      .then(response => setAnimeList(response.data))
      .catch(error => console.error("Error fetching similar anime:", error));
  }, [animeName]);

  return (
    <div className="p-10">
      <h2 className="text-3xl font-bold mb-6">Similar Anime</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {animeList.map(anime => (
          <div key={anime.mal_id} className="bg-secondary p-4 rounded-md">
            <img src={anime.image_url} alt={anime.title_english} className="rounded-md" />
            <h3 className="text-lg font-bold mt-2">{anime.title_english}</h3>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SimilarAnime;
