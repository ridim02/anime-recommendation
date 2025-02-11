import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import AnimeCard from "../components/AnimeCard";
import LoadingSpinner from "../components/LoadingSpinner";
import { ChevronLeft, ChevronRight } from "lucide-react";
import HeroSection from "../components/HeroSection";

const HomePage = () => {
  const [recommendedAnime, setRecommendedAnime] = useState([]);
  const [popularAnime, setPopularAnime] = useState([]);
  const [genreAnime, setGenreAnime] = useState({});
  const [loadingRec, setLoadingRec] = useState(true);
  const [loadingPop, setLoadingPop] = useState(true);
  const [loadingGenres, setLoadingGenres] = useState(true);
  
  const [loadingSearch, setLoadingSearch] = useState(true);
  const [searchResult, setSearchResult] = useState([]);
  const [searchError, setSearchError] = useState("");

  const carouselRef = useRef(null);
  const userId = 105315;

  useEffect(() => {
    axios
      .get(`http://localhost:3001/recommendations/${userId}`)
      .then((response) => {
        setRecommendedAnime(response.data);
        setLoadingRec(false);
      })
      .catch((error) => {
        console.error("Error fetching recommended anime:", error);
        setLoadingRec(false);
      });

    axios
      .get("http://localhost:3001/popular-animes")
      .then((response) => {
        setPopularAnime(response.data);
        setLoadingPop(false);
      })
      .catch((error) => {
        console.error("Error fetching popular anime:", error);
        setLoadingPop(false);
      });
  }, [userId]);

  useEffect(() => {
    axios
      .get(`http://localhost:3001/user/preferences/${userId}`)
      .then((response) => {
        const preferences = response.data;
        let genres = [];

        if (preferences.genres && preferences.genres.length > 0) {
          genres = preferences.genres;
        } else if (preferences.anime_ids && preferences.anime_ids.length > 0) {
          const genreSet = new Set();
          preferences.anime_ids.forEach((anime) => {
            if (anime.Genres) {
              anime.Genres.split(",")
                .map((g) => g.trim())
                .forEach((g) => genreSet.add(g));
            }
          });
          genres = Array.from(genreSet);
        }

        genres = genres.slice(0, 5);

        Promise.all(
          genres.map((genre) =>
            axios
              .get(`http://localhost:3001/anime-by-genre/${genre}/${userId}`)
              .then((res) => ({ genre, anime: res.data }))
          )
        )
          .then((results) => {
            const newGenreData = {};
            results.forEach((result) => {
              newGenreData[result.genre] = result.anime;
            });
            setGenreAnime(newGenreData);
            setLoadingGenres(false);
          })
          .catch((error) => {
            console.error("Error fetching anime by genre:", error);
            setLoadingGenres(false);
          });
      })
      .catch((error) => {
        console.error("Error fetching user preferences:", error);
        setLoadingGenres(false);
      });
  }, [userId]);

  const scrollLeft = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: -500, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: 500, behavior: "smooth" });
    }
  };

  const handleSearch = async (animeId) => {
    setSearchResult(null);
    setSearchError("");

    try {
      const response = await axios.get(`http://localhost:3001/anime-by-name/${animeId}`);

      if (response.data) {
        setSearchResult(response.data);
        setLoadingSearch(false);
      } else {
        setSearchError("Anime not found");
      }
    } catch (error) {
      console.error("Error fetching anime details:", error);
      setSearchError("Failed to fetch anime data");
    }
  };

  const GenreCarousel = ({ genre, animeList }) => {
    const genreCarouselRef = useRef(null);

    const scrollLeftGenre = () => {
      if (genreCarouselRef.current) {
        genreCarouselRef.current.scrollBy({ left: -500, behavior: "smooth" });
      }
    };

    const scrollRightGenre = () => {
      if (genreCarouselRef.current) {
        genreCarouselRef.current.scrollBy({ left: 500, behavior: "smooth" });
      }
    };

    return (
      <div className="relative mb-8">
        <div className="pl-5 pr-5 pt-5 bg-secondary rounded-lg shadow">
          <h2 className="text-2xl font-semibold mb-2">{genre}</h2>
          <button
            onClick={scrollLeftGenre}
            className="absolute left-5 top-1/2 transform -translate-y-1/2 bg-secondary bg-opacity-50 p-2 rounded-full z-10"
          >
            <ChevronLeft className="text-white w-6 h-6" />
          </button>
          <div
            ref={genreCarouselRef}
            className="flex space-x-4 overflow-x-auto scroll-smooth snap-x snap-mandatory scrollbar-hidden hide-scrollbar px-5 pb-5"
          >
            {animeList.map((anime, index) => (
              <div key={anime.mal_id || index} className="snap-start flex-shrink-0 w-64">
                <AnimeCard anime={anime} />
              </div>
            ))}
          </div>
          <button
            onClick={scrollRightGenre}
            className="absolute right-5 top-1/2 transform -translate-y-1/2 bg-secondary bg-opacity-50 p-2 rounded-full z-10"
          >
            <ChevronRight className="text-white w-6 h-6" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen text-white">
      <HeroSection onSearch={handleSearch} />

      {searchError && (
        <div className="container mx-auto px-4 py-6">
          <p className="text-red-500">{searchError}</p>
        </div>
      )}
      {searchResult && searchResult.length > 0 && (
        <div className="container mx-auto px-4 py-6 bg-secondary rounded-lg shadow p-4 lg:w-3/4">
          <h2 className="text-2xl font-semibold mb-4">Search Result</h2>
          {loadingSearch ? (
                <LoadingSpinner />
              ) : (
                <div className="relative">
                  <button
                    onClick={scrollLeft}
                    className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-secondary bg-opacity-50 p-3 rounded-full z-10"
                  >
                    <ChevronLeft className="text-white w-8 h-8" />
                  </button>
                  <div
                    ref={carouselRef}
                    className="flex space-x-4 overflow-x-auto scroll-smooth snap-x snap-mandatory scrollbar-hidden hide-scrollbar px-5 pb-5"
                  >
                    {searchResult.map((anime) => (
                      <div key={anime.mal_id} className="snap-start flex-shrink-0 w-64">
                        <AnimeCard anime={anime} />
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={scrollRight}
                    className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-secondary bg-opacity-50 p-3 rounded-full z-10"
                  >
                    <ChevronRight className="text-white w-8 h-8" />
                  </button>
                </div>
              )}
        </div>
      )}

      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="lg:w-3/4">
            <section className="bg-secondary rounded-lg shadow p-4">
              <h2 className="text-2xl font-semibold mb-2">Recommended Anime</h2>
              {loadingRec ? (
                <LoadingSpinner />
              ) : (
                <div className="relative">
                  <button
                    onClick={scrollLeft}
                    className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-secondary bg-opacity-50 p-3 rounded-full z-10"
                  >
                    <ChevronLeft className="text-white w-8 h-8" />
                  </button>
                  <div
                    ref={carouselRef}
                    className="flex space-x-4 overflow-x-auto scroll-smooth snap-x snap-mandatory scrollbar-hidden hide-scrollbar px-5 pb-5"
                  >
                    {recommendedAnime.map((anime) => (
                      <div key={anime.mal_id} className="snap-start flex-shrink-0 w-64">
                        <AnimeCard anime={anime} />
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={scrollRight}
                    className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-secondary bg-opacity-50 p-3 rounded-full z-10"
                  >
                    <ChevronRight className="text-white w-8 h-8" />
                  </button>
                </div>
              )}
            </section>

            <section className="mt-8">
              <h2 className="text-2xl font-semibold mb-4">Genres</h2>
              {loadingGenres ? (
                <LoadingSpinner />
              ) : (
                Object.keys(genreAnime).map((genre) => (
                  <GenreCarousel key={genre} genre={genre} animeList={genreAnime[genre]} />
                ))
              )}
            </section>
          </div>

          <section className="lg:w-1/4 lg:ml-8 p-4 bg-secondary rounded-lg shadow">
            <h2 className="text-2xl font-semibold mb-4">Popular Anime</h2>
            {loadingPop ? (
              <LoadingSpinner />
            ) : (
              <div className="flex flex-col gap-4">
                {popularAnime.map((anime) => (
                  <div key={anime.mal_id} className="h-100">
                    <AnimeCard anime={anime} />
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
