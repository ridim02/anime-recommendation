import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import LoadingSpinner from '../components/LoadingSpinner';
import AnimeCard from '../components/AnimeCard';
import { ChevronLeft, ChevronRight, ExternalLink, Youtube } from 'lucide-react';

const AnimeDetailsPage = () => {
  const { id } = useParams();
  
  const [anime, setAnime] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [similarAnime, setSimilarAnime] = useState([]);
  const [loadingSimilar, setLoadingSimilar] = useState(true);
  
  const similarCarouselRef = useRef(null);

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

  useEffect(() => {
    if (anime) {
      axios.get(`http://localhost:3001/user/similar-anime/${id}`)
        .then(response => {
          setSimilarAnime(response.data);
          setLoadingSimilar(false);
        })
        .catch(error => {
          console.error('Error fetching similar anime:', error);
          setLoadingSimilar(false);
        });
    }
  }, [anime, id]);

  const scrollLeftSimilar = () => {
    if (similarCarouselRef.current) {
      similarCarouselRef.current.scrollBy({ left: -500, behavior: 'smooth' });
    }
  };

  const scrollRightSimilar = () => {
    if (similarCarouselRef.current) {
      similarCarouselRef.current.scrollBy({ left: 500, behavior: 'smooth' });
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!anime) {
    return <div className="container mx-auto px-4 py-6">Anime not found.</div>;
  }

  return (
    <div className="container mx-auto px-4 py-6 bg-primary text-white min-h-screen">
      <div className="flex flex-col md:flex-row">
        <img src={anime.image_url} alt={anime.title_english || anime.title} className="w-full md:w-1/3 object-cover rounded-lg"  />
        <div className="md:ml-6 mt-4 md:mt-0 w-11/12">
          <h1 className="text-3xl font-bold">
            {anime.title_english || anime.title}
          </h1>
          <p className="mt-4 text-highlight">{anime.synopsis}</p>
          <p className="mt-4">
            <span className="font-semibold">Status:</span> {anime.status}
          </p>
          <p className="mt-2">
            <span className="font-semibold">Season:</span> {anime.season}
          </p>
          <p className="mt-2">
            <span className="font-semibold">Score:</span>⭐ {anime.score}
          </p>
          
          <div className="mt-4">
            <h2 className="text-xl font-semibold mb-2">Links:</h2>
            <div className="flex items-center space-x-4">
              {anime.url && (
                <a 
                  href={anime.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  title="View on MyAnimeList"
                >
                  <ExternalLink className="w-6 h-6 text-secondary hover:text-secondary" />
                </a>
              )}
              {anime.trailer_url && (
                <a 
                  href={anime.trailer_url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  title="Watch Trailer"
                >
                  <Youtube className="w-6 h-6 text-accent hover:text-accent" />
                </a>
              )}
            </div>
          </div>

          {anime.streaming && anime.streaming.length > 0 && (
            <div className="mt-4">
              <h2 className="text-xl font-semibold mb-2">Streaming:</h2>
              <div className="flex items-center space-x-4">
                {anime.streaming.map((link, idx) => (
                  <a key={idx} href={link.url} target="_blank" rel="noopener noreferrer" title={`Watch on ${link.name}`} >
                    <span className="inline-flex items-center space-x-1 bg-secondary px-2 py-1 rounded">
                      <ExternalLink className="w-5 h-5" />
                      <span className="text-sm text-white">{link.name}</span>
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {anime.external && anime.external.length > 0 && (
            <div className="mt-4">
              <h2 className="text-xl font-semibold mb-2">External Links:</h2>
              <div className="flex flex-wrap items-center gap-4">
                {anime.external.map((link, idx) => (
                  <a
                    key={idx}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={link.name}
                    className="inline-flex items-center space-x-1 bg-secondary px-2 py-1 rounded"
                  >
                    <ExternalLink className="w-5 h-5" />
                    <span className="text-sm text-white">{link.name}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {anime.genre && (
            <div className="mt-4">
              <h2 className="text-xl font-semibold">Genres:</h2>
              <div className="flex flex-wrap mt-2">
                {anime.genre.map(g => (
                  <span 
                    key={g.mal_id} 
                    className="mr-2 mb-2 px-2 py-1 bg-accent text-white rounded-full text-sm"
                  >
                    {g.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-12">
        <h2 className="text-2xl font-semibold mb-4">Similar Anime</h2>
        {loadingSimilar ? (
          <LoadingSpinner />
        ) : similarAnime.length === 0 ? (
          <p>No similar anime found.</p>
        ) : (
          <div className="bg-secondary rounded-lg shadow p-4">

            <div ref={similarCarouselRef} className="flex space-x-4 overflow-x-auto scroll-smooth snap-x snap-mandatory scrollbar-hidden hide-scrollbar" >
              {similarAnime.map((simAnime, index) => (
                <div key={simAnime.mal_id || index} className="snap-start flex-shrink-0 w-64">
                  <AnimeCard anime={simAnime} />
                </div>
              ))}
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default AnimeDetailsPage;
