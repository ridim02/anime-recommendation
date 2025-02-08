import { useState } from 'react';
import axios from 'axios';

export default function PreferencesPage() {
  const [setUserId] = useState('');
  const userId = 105315;
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchPreferences = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:3001/user/preferences/${userId}`);
      setPreferences(res.data);
    } catch (error) {
      alert('Error fetching user preferences.');
      setPreferences(null);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="text-center mb-8">
        <h1 className="text-5xl font-extrabold">User Preferences</h1>
        <p className="mt-2 text-lg text-gray-400">
          Enter a User ID to see their anime preferences.
        </p>
      </div>
      <div className="flex justify-center mb-8">
        <input
          type="text"
          placeholder="User ID"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          className="p-3 rounded-l-lg text-black w-60"
        />
        <button
          onClick={fetchPreferences}
          className="bg-blue-500 px-6 py-3 rounded-r-lg hover:bg-blue-700 transition-all"
        >
          Get Preferences
        </button>
      </div>
      {loading && (
        <p className="text-center text-xl animate-pulse">Loading...</p>
      )}
      {preferences && (
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-blue-500 text-left text-gray-200 whitespace-pre-wrap">
          {JSON.stringify(preferences, null, 2)}
        </div>
      )}
    </div>
  );
}
