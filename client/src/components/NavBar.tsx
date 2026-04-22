import { useAuth } from "../hooks/useAuth";
import { Link, useLocation } from "react-router-dom";

export const NavBar = () => {
  const { logout, user } = useAuth();
  const location = useLocation();

  const linkStyle = (path: string) =>
    `relative text-sm font-medium transition ${
      location.pathname === path
        ? "text-white"
        : "text-gray-300 hover:text-white"
    }`;

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-blue-900 border-b border-blue-800 shadow-md">
      <div className="w-full px-3 sm:px-6 py-2 flex justify-between items-center">
        {/* Logo */}
        <div className="flex items-center gap-5 sm:gap-10 mt-2 ">
          <Link
            to="/"
            className="text-lg font-semibold tracking-wide text-white"
          >
            <img
              src="logo.png"
              alt="Logo"
              className="h-8 sm:h-12 relative bottom-[6px] sm:bottom-[9px]"
            />
          </Link>

          <div className="flex items-center gap-6 sm:gap-8">
            <Link
              to="/"
              className={`text-base text-sm sm:text-lg font-medium transition-all duration-200 transform ${
                location.pathname === "/"
                  ? "text-white scale-105"
                  : "text-gray-300 hover:text-white hover:scale-105"
              }`}
            >
              Hjem
            </Link>

            <Link
              to="/registerequipment"
              className={`text-base sm:text-lg font-medium transition-all duration-200 transform  ${
                location.pathname === "/registerequipment"
                  ? "text-white scale-105"
                  : "text-gray-300 hover:text-white hover:scale-105"
              }`}
            >
              Registrer utstyr
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {user && (
            <div className="hidden sm:flex items-center gap-2 text-sm text-gray-200 mt-1">
              <div className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-800">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <span>{user.username}</span>
            </div>
          )}

          <button
            onClick={logout}
            className="text-xs mt-1 sm:text-sm font-medium text-white bg-red-600 hover:bg-red-700 px-2 sm:px-4 py-1 sm:py-2 rounded-lg transition focus:outline-none focus:ring-2 focus:ring-red-400 cursor-pointer"
          >
            Logg ut
          </button>
        </div>
      </div>
    </nav>
  );
};
