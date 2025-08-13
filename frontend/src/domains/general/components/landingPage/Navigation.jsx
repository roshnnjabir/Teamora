import { useState } from "react";
import logo from "../../../../assets/teamora/teamora_logo.png";
import { Link } from "react-router-dom";

export default function Navigation() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="bg-white shadow-sm border-b border-[#E5E8EC] px-6 py-4 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        {/* Logo */}
        <div className="flex items-center">
          <img
            src={logo}
            alt="Teamora Logo"
            className="w-10 h-10 object-contain rounded-full shadow-sm mr-3"
          />
          <span className="text-2xl font-bold text-[#1A2A44]">Teamora</span>
        </div>

        {/* Desktop Buttons */}
        <div className="hidden md:flex gap-4">
          <Link
            to="/signup"
            className="px-5 py-2 bg-[#00C4B4] hover:bg-teal-600 text-white rounded-full font-medium transition-all duration-200"
          >
            Get Started
          </Link>
          <Link
            to="/accessyourworkspace"
            className="px-5 py-2 text-[#1A2A44] hover:text-[#00C4B4] font-medium transition-all duration-200"
          >
            Your Workspace
          </Link>
        </div>

        {/* Hamburger Icon (Mobile) */}
        <button
          className="md:hidden flex flex-col justify-between w-6 h-5 focus:outline-none"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span
            className={`block h-[3px] w-full bg-[#1A2A44] rounded transition-all duration-300 ${
              menuOpen ? "rotate-45 translate-y-2" : ""
            }`}
          />
          <span
            className={`block h-[3px] w-full bg-[#1A2A44] rounded transition-all duration-300 ${
              menuOpen ? "opacity-0" : ""
            }`}
          />
          <span
            className={`block h-[3px] w-full bg-[#1A2A44] rounded transition-all duration-300 ${
              menuOpen ? "-rotate-45 -translate-y-2" : ""
            }`}
          />
        </button>
      </div>

      {/* Mobile Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-2/3 bg-white shadow-xl border-l border-[#E5E8EC] transform transition-all duration-500 ease-[cubic-bezier(0.77,0,0.175,1)] delay-75 z-40 ${
          menuOpen ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
        }`}
      >

        {/* Close Button */}
        <div className="absolute top-6 left-6">
          <button
            onClick={() => setMenuOpen(false)}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-white border border-gray-300 hover:bg-gray-100 transition-colors"
            aria-label="Close sidebar"
          >
            <svg
              className="w-5 h-5 text-gray-700"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              viewBox="0 0 24 24"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        </div>

        {/* Sidebar Content */}
        <div className="flex flex-col items-center p-6 mt-16 space-y-6">
          {/* Centered Square Logo */}
          <img
            src={logo}
            alt="Teamora Square Logo"
            className="w-16 h-16 object-contain mb-4"
          />

          <Link
            to="/signup"
            onClick={() => setMenuOpen(false)}
            className="w-full px-5 py-3 bg-[#00C4B4] hover:bg-teal-600 text-white rounded-full font-medium text-center transition-all duration-200"
          >
            Get Started
          </Link>
          <Link
            to="/accessyourworkspace"
            onClick={() => setMenuOpen(false)}
            className="w-full px-5 py-3 text-[#1A2A44] hover:text-[#00C4B4] font-medium text-center transition-all duration-200"
          >
            Your Workspace
          </Link>
        </div>
      </div>

      {/* Overlay when sidebar is open */}
      {menuOpen && (
        <div
          className={`fixed inset-0 bg-black/40 backdrop-blur-md z-30 md:hidden transition-all duration-500 ease-[cubic-bezier(0.77,0,0.175,1)] ${
            menuOpen ? "opacity-100 delay-100" : "opacity-0"
          }`}
          onClick={() => setMenuOpen(false)}
        ></div>
      )}
    </nav>
  );
}