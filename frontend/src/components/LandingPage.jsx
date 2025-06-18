  import { Link } from 'react-router-dom';
  import { useEffect } from 'react';
  import { useNavigate } from 'react-router-dom';
  import logo from '../assets/teamora/teamora_logo.png';

  export default function LandingPage() {
    const navigate = useNavigate();

    useEffect(() => {
      const hostname = window.location.hostname;

      // If it's not exactly "localhost", redirect to login or dashboard
      if (hostname !== 'localhost') {
        navigate('/login');
      }
    }, [navigate]);

    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F9FAFB] px-4 text-center">
        {/* Logo */}
        <img src={logo} alt="Teamora Logo" className="w-28 h-28 object-contain mb-6 rounded-full shadow-md" />

        {/* Heading */}
        <h1 className="text-4xl md:text-5xl font-extrabold text-[#1A2A44] mb-3">
          Welcome to <span className="text-[#00C4B4]">Teamora</span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg md:text-xl text-[#2F3A4C] mb-10 max-w-xl">
          The ultimate <span className="text-[#FF6F61] font-medium">multi-tenant</span> project management platform built for speed, clarity, and collaboration.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            to="/signup"
            className="px-6 py-3 bg-[#00C4B4] hover:bg-teal-600 text-white rounded-md font-semibold shadow transition"
          >
            Signup as a Tenant
          </Link>
          <Link
            to="/"
            className="px-6 py-3 border border-[#1A2A44] text-[#1A2A44] hover:bg-[#1A2A44] hover:text-white rounded-md font-semibold shadow transition"
          >
            User Login
          </Link>
        </div>

        {/* Optional Footer */}
        <p className="mt-12 text-sm text-[#B0B8C5]">
          © {new Date().getFullYear()} Teamora Inc. All rights reserved.
        </p>
      </div>
    );
  }
