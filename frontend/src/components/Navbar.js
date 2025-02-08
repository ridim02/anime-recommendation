import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="bg-gray-800 text-white p-4 flex justify-between items-center">
      <div className="text-lg font-bold">
        <Link to="/">AnimeRec</Link>
      </div>
      <div className="space-x-4">
        <Link to="/" className="hover:text-gray-300">Home</Link>
        <Link to="/search" className="hover:text-gray-300">Search</Link>
        <Link to="/profile" className="hover:text-gray-300">Profile</Link>
        <Link to="/group" className="hover:text-gray-300">Group</Link>
      </div>
    </nav>
  );
};

export default Navbar;
