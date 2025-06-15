import { Link } from 'react-router-dom';
import logo from '../assets/logo.jpeg'

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center bg-gray-50">
      <img src={logo} alt="Teamora Logo" className="w-28 mb-6" />

      <h1 className="text-4xl font-bold text-gray-800 mb-2">Welcome to Teamora</h1>
      <p className="text-lg text-gray-600 mb-8">
        The ultimate multi-tenant project management platform
      </p>

      <div className="flex flex-col sm:flex-row gap-4">
        <Link
          to="/signup"
          className="px-6 py-3 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 transition"
        >
          Signup as a Tenant
        </Link>
        <Link
          to="/login"
          className="px-6 py-3 bg-green-600 text-white rounded-md font-semibold hover:bg-green-700 transition"
        >
          User Login
        </Link>
      </div>
    </div>
  );
}
