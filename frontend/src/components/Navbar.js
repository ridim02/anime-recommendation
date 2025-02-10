import { useState } from "react";
import { Link } from "react-router-dom";
import { FiSearch, FiMenu, FiX } from "react-icons/fi";
import AniMatchLogo from "./AniMatchLogo";
import HeroSection from "./HeroSection";


const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="bg-[#131225] text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <div ></div>

        <ul className="hidden md:flex space-x-6 text-lg">
          <li>
            <Link to="/" className="text-2xl font-bold">
              <nav className="p-4 bg-[#141321] flex items-center">
                <AniMatchLogo />
              </nav>
            </Link>
            </li>
        </ul>

        <div ></div>
      </div>
    </nav>
  );
};

export default Navbar;