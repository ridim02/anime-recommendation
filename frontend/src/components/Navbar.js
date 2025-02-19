import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiSearch, FiChevronDown } from "react-icons/fi";
import AniMatchLogo from "./AniMatchLogo";

const Navbar = ({ onSearch }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  const userId = sessionStorage.getItem("userId");
  const username = sessionStorage.getItem("username");

  const toggleDropdown = () => setMenuOpen(!menuOpen);

  const handleSearchClick = () => {
    if (searchTerm.trim() !== "" && typeof onSearch === "function") {
      onSearch(searchTerm);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("userId");
    sessionStorage.removeItem("username");
    setMenuOpen(false);
    navigate("/login");
  };

  return (
    <nav className="text-white p-4">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center">
          <Link to="/">
            <AniMatchLogo />
          </Link>
        </div>

        <div className="flex-1 mx-4">

        </div>

        <div className="relative">
          {userId ? (
            <>
              <button
                onClick={toggleDropdown}
                className="bg-pink-400 text-white flex items-center gap-2 py-3 px-6 rounded-lg text-lg font-bold w-fit focus:outline-none hover:bg-pink-500 transition"
              >
                {username}
                <FiChevronDown className="ml-2" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-secondary rounded-lg shadow-lg py-2 z-20">
                  <Link
                    to="/group"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2 hover:bg-primary"
                  >
                    Group
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 hover:bg-primary"
                  >
                    Logout
                  </button>
                </div>
              )}
            </>
          ) : (
            <Link
              to="/login"
              className="bg-pink-400 text-white flex items-center gap-2 py-3 px-6 rounded-lg text-lg font-bold w-fit hover:bg-pink-500 transition"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;