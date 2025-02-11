import React, { useState } from "react";
import { FiSearch } from "react-icons/fi";
import AniMatchLogo from "./AniMatchLogo";

const HeroSection = ({ onSearch }) => {
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearchClick = () => {
    if (searchTerm.trim() !== "" && typeof onSearch === "function") {
      onSearch(searchTerm);
    }
  };

  return (
    <div className="text-white flex items-center justify-center mb-10">
      <div className="relative bg-[#1c1b29] p-8 rounded-3xl flex flex-col gap-4 w-[80%] max-w-4xl shadow-lg border border-pink-400">
        {/* <AniMatchLogo /> */}
        <div className="relative flex items-center">
          <input type="text" placeholder="Search anime..." className="w-full p-3 pl-4 rounded-lg bg-white text-gray-900 focus:outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          <button onClick={handleSearchClick} className="absolute right-2 bg-pink-400 p-3 rounded-lg" >
            <FiSearch className="text-white text-lg" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;