// Navigation.jsx
import logo from '../../assets/teamora/teamora_logo.png';
import { Link } from 'react-router-dom';

export default function Navigation() {
  return (
    <nav className="bg-white shadow-sm border-b border-[#E5E8EC] px-6 py-4">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <div className="flex items-center">
          <img src={logo} alt="Teamora Logo" className="w-10 h-10 object-contain rounded-full shadow-sm mr-3" />
          <span className="text-2xl font-bold text-[#1A2A44]">Teamora</span>
        </div>
        <div className="flex gap-4">
          <Link to="/signup" className="px-4 py-2 bg-[#00C4B4] hover:bg-teal-600 text-white rounded-md font-medium transition">
            Get Started
          </Link>
          <Link to="/" className="px-4 py-2 text-[#1A2A44] hover:text-[#00C4B4] font-medium transition">
            Login
          </Link>
        </div>
      </div>
    </nav>
  );
}