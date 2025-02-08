import React, { useState, useEffect } from 'react';
import axios from 'axios';

const UserProfilePage = () => {
  const userId = 1;
  const [preferences, setPreferences] = useState(null);
  const [similarUsers, setSimilarUsers] = useState(null);
  const [loadingPref, setLoadingPref] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);

  useEffect(() => {
    axios.get(`http://localhost:3001/user/preferences/${userId}`)
      .then(response => {
        setPreferences(response.data);
        setLoadingPref(false);
      })
      .catch(error => {
        console.error('Error fetching user preferences:', error);
        setLoadingPref(false);
      });

    axios.get(`http://localhost:3001/user/similar-users/${userId}`)
      .then(response => {
        setSimilarUsers(response.data);
        setLoadingUsers(false);
      })
      .catch(error => {
        console.error('Error fetching similar users:', error);
        setLoadingUsers(false);
      });
  }, [userId]);

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold mb-6">User Profile</h1>
      
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Preferences</h2>
        {loadingPref ? (
          <p>Loading preferences...</p>
        ) : preferences ? (
          <div>
            <h3 className="text-xl font-medium mb-2">Favorite Genres</h3>
            <div className="flex flex-wrap">
              {preferences.genres && Object.keys(preferences.genres).map((genre, index) => (
                <span key={index} className="mr-2 mb-2 px-2 py-1 bg-green-200 text-green-800 rounded-full text-sm">
                  {genre}: {preferences.genres[genre]}
                </span>
              ))}
            </div>
            <h3 className="text-xl font-medium mt-4 mb-2">Anime Preferences</h3>
            <ul className="list-disc ml-5">
              {preferences.anime_ids && preferences.anime_ids.map((anime, index) => (
                <li key={index}>
                  {anime.eng_version} - {anime.Genres.join(', ')}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p>No preferences available.</p>
        )}
      </section>
      
      <section>
        <h2 className="text-2xl font-semibold mb-4">Similar Users</h2>
        {loadingUsers ? (
          <p>Loading similar users...</p>
        ) : similarUsers ? (
          <ul className="list-disc ml-5">
            {similarUsers.similar_users && similarUsers.similar_users.map((user, index) => (
              <li key={index}>
                User ID: {user.user_id} – Similarity: {user.similarity}
              </li>
            ))}
          </ul>
        ) : (
          <p>No similar users found.</p>
        )}
      </section>
    </div>
  );
};

export default UserProfilePage;
