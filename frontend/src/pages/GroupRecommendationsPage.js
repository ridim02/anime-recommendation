import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import AnimeCard from "../components/AnimeCard";
import LoadingSpinner from "../components/LoadingSpinner";
import { ChevronLeft, ChevronRight, User } from "lucide-react";

const GroupRecommendationsPage = () => {
  const [groupMembers, setGroupMembers] = useState([]);
  const [animeIds, setAnimeIds] = useState([]);
  const [groupAnime, setGroupAnime] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingAnime, setLoadingAnime] = useState(false);
  const [votes, setVotes] = useState({});
  const [selectedAnime, setSelectedAnime] = useState(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [votingStarted, setVotingStarted] = useState(false);
  const carouselRef = useRef(null);

  // Fetch group recommendations (group members and anime IDs)
  useEffect(() => {
    axios
      .get("http://localhost:3001/group/random/recommendations")
      .then((response) => {
        const { anime_ids, user_ids } = response.data;
        setAnimeIds(anime_ids);
        setGroupMembers(user_ids);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching group recommendations:", error);
        setLoading(false);
      });
  }, []);

  // Handler to start voting: process anime IDs and initialize votes
  const handleStartVoting = async () => {
    setLoadingAnime(true);
    try {
      const animeDetails = await processInBatches(animeIds, 3, 1000);
      setGroupAnime(animeDetails);
      const initialVotes = {};
      animeDetails.forEach((anime) => {
        initialVotes[anime.mal_id] = 0;
      });
      setVotes(initialVotes);
      setVotingStarted(true);
      setLoadingAnime(false);
      setTimeLeft(30);
    } catch (error) {
      console.error("Error processing anime IDs:", error);
      setLoadingAnime(false);
    }
  };

  // Timer effect: starts when voting begins.
  useEffect(() => {
    if (!votingStarted) return;
    if (timeLeft <= 0) {
      let maxVotes = -1;
      let winner = null;
      groupAnime.forEach((anime) => {
        if (votes[anime.mal_id] > maxVotes) {
          maxVotes = votes[anime.mal_id];
          winner = anime;
        }
      });
      setSelectedAnime(winner);
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, groupAnime, votes, votingStarted]);

  const handleVote = (animeId) => {
    setVotes((prevVotes) => ({
      ...prevVotes,
      [animeId]: prevVotes[animeId] + 1,
    }));
  };

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

  // Helper: processInBatches function to fetch anime details
  async function processInBatches(items, batchSize, delayMs) {
    const results = [];
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(async (animeId) => {
          try {
            const res = await axios.get(`http://localhost:3001/anime/${animeId}`);
            return res.data;
          } catch (error) {
            console.error(`Error processing anime ${animeId}:`, error.message);
            return null;
          }
        })
      );
      results.push(...batchResults);
      if (i + batchSize < items.length)
        await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
    return results.filter((item) => item !== null);
  }

  return (
    <div className="min-h-screen bg-primary text-white py-6">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-6">Group Recommendations</h1>

        {/* Display group members list if voting hasn't started */}
        {!votingStarted && (
          <div className="w-full mb-6">
            <h2 className="text-xl font-bold mb-2">Group Members</h2>
            <ul className="flex flex-wrap justify-center gap-4">
              {groupMembers.map((userId) => (
                <li key={userId} className="flex items-center gap-2 bg-secondary px-4 py-2 rounded-full">
                  <User className="w-5 h-5 text-accent" />
                  <span className="text-sm">User {userId}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Start Voting Button (only when voting hasn't started) */}
        {!votingStarted && (
          <div className="mb-6 flex justify-center">
            <button
              onClick={handleStartVoting}
              className="bg-pink-400 hover:bg-pink-500 transition text-white font-bold py-3 px-6 rounded-lg"
            >
              Start Voting
            </button>
          </div>
        )}

        {/* Timer Display */}
        {votingStarted && (
          <div className="flex justify-end mb-4">
            {timeLeft > 0 ? (
              <div className="bg-secondary px-6 py-3 rounded-full shadow-md">
                <span className="text-2xl font-bold">{timeLeft}</span>
                <span className="ml-2 text-lg">s remaining</span>
              </div>
            ) : (
              <div className="bg-pink-400 px-8 py-4 rounded-full shadow-lg">
                <span className="text-2xl font-bold">Voting Ended!</span>
              </div>
            )}
          </div>
        )}

        {/* Winner Display */}
        {timeLeft <= 0 && selectedAnime && (
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-4 text-center">
              Winner: {selectedAnime.title}
            </h2>
            <div className="flex justify-center">
              <div className="w-80">
                <AnimeCard anime={selectedAnime} />
              </div>
            </div>
          </div>
        )}

        {/* Voting Carousel */}
        {votingStarted && (
          <div className="relative bg-gray-900 p-6 rounded-lg shadow-lg">
            <button
              onClick={scrollLeft}
              className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-secondary bg-opacity-50 p-3 rounded-full z-10"
            >
              <ChevronLeft className="text-white w-8 h-8" />
            </button>
            <div
              ref={carouselRef}
              className="flex space-x-8 overflow-x-auto scroll-smooth snap-x snap-mandatory scrollbar-hidden hide-scrollbar px-5 pb-5"
            >
              {groupAnime.map((anime) => (
                <div key={anime.mal_id} className="snap-start flex-shrink-0 w-64">
                  <AnimeCard anime={anime} />
                  <div className="mt-2 flex justify-between items-center">
                    <button
                      onClick={() => handleVote(anime.mal_id)}
                      className="bg-pink-400 text-white px-3 py-1 rounded hover:bg-pink-500 transition"
                    >
                      Vote
                    </button>
                    <span className="text-sm">Votes: {votes[anime.mal_id]}</span>
                  </div>
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
    </div>
  );
};

export default GroupRecommendationsPage;
