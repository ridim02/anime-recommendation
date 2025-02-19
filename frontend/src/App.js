import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import AnimeDetailsPage from './pages/AnimeDetailsPage';
import SearchPage from './pages/SearchPage';
import UserProfilePage from './pages/UserProfilePage';
import GroupRecommendationsPage from './pages/GroupRecommendationsPage';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/anime/:id" element={<AnimeDetailsPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/profile" element={<UserProfilePage />} />
        <Route path="/group" element={<GroupRecommendationsPage />} />
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    </Router>
  );
}

export default App;