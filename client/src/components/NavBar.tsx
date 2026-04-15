import { useAuth } from "../hooks/useAuth";
import { Link } from "react-router-dom";

export const NavBar = () => {
  const { logout, user: currentUser } = useAuth();

  return (
    <nav className="bg-blue-900 text-white px-6 py-4 flex justify-between items-center z-50 fixed top-0 left-0 w-full shadow-lg">
      <div className="flex items-center space-x-6">
        <Link to="/" className="hover:text-gray-400 transition">
          Hjem
        </Link>
      </div>
      <div className="flex items-center space-x-6">
        <Link
          to="/registerequipment"
          className="hover:text-gray-400 transition"
        >
          Registrer utstyr
        </Link>
      </div>

      <div className="flex items-center space-x-4">
        {currentUser && (
          <span className="text-sm">Hei, {currentUser.username}</span>
        )}
        <button
          onClick={logout}
          className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded transition"
        >
          Logg ut
        </button>
      </div>
    </nav>
  );
};
