import { Link } from "react-router-dom";
import user from "../assets/user.svg";

export const NavBar = () => {
  return (
    <nav className="bg-blue-900 text-white px-6 py-4 flex justify-between items-center z-50 fixed top-0 left-0 w-full shadow-lg">
      <div className="flex items-center space-x-6">
        <Link to="/" className="hover:text-gray-400 transition">
          Hjem
        </Link>
        <Link to="/calendar" className="hover:text-gray-400 transition">
          Kalender
        </Link>
      </div>

      <div>
        <Link to="/welcome">
          <a href="#myprofile">
            <img src={user} alt="User" className="w-5 h-5 cursor-pointer" />
          </a>
        </Link>
      </div>
    </nav>
  );
};
