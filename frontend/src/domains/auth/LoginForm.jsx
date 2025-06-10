import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../../contexts/apiClient';
import { setUser } from '../../features/Auth/authSlice';
import logo from '../../assets/teamora/teamora.png';
import { getInputClasses } from '../../styles/formClasses';

function extractErrorMessage(error, fallback = 'Something went wrong') {
  return (
    error?.response?.data?.non_field_errors?.[0] ||
    error?.response?.data?.detail ||
    Object.values(error?.response?.data || {}).flat()?.[0] ||
    error?.message ||
    fallback
  );
}

export default function LoginForm() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const hostname = window.location.hostname;
  const isRootDomain =
    hostname === 'chronocrust.shop' || hostname === 'localhost';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.querySelector('input[type="email"]')?.focus();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await apiClient.post('/api/token/', { email, password });

      const userRes = await apiClient.get('/api/me/');
      const user = userRes.data;

      const roleMap = {
        super_admin: "Super Admin",
        tenant_admin: "Tenant Admin",
        project_manager: "Project Manager",
        hr: "HR",
        developer: "Developer",
      };

      dispatch(setUser({ ...user, displayRole: roleMap[user.role] || user.role }));

      switch (user.role) {
        case 'super_admin':
          if (!isRootDomain) {
            setError("Super Admin must log in from chronocrust.shop");
            return;
          }
          navigate('/super_admin');
          break;
        
        case 'tenant_admin':
        case 'project_manager':
        case 'developer':
        case 'hr':
          if (isRootDomain) {
            setError("Tenant users must log in from their workspace subdomain.");
            return;
          }
          navigate(`/${user.role}`);
          break;
        
        default:
          navigate('/');
      }

    } catch (err) {
      console.error("Login/User fetch error:", err);
      const message = err?.response
        ? extractErrorMessage(err, 'Login failed.')
        : 'Server unreachable. Please try again later.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB] px-4">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Left - Image */}
        <div className="hidden md:block">
          <img
            src={logo}
            alt="Login Visual"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Right - Form */}
        <div className="p-8 sm:p-10">
          <div className="mb-6 flex justify-between items-center">
            <h2 className="text-2xl font-semibold text-[#1A2A44]">Login</h2>
            <Link to="/" className="text-sm text-[#00C4B4] hover:underline">← Back</Link>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm mb-1 block text-gray-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value.toLowerCase())}
                required
                placeholder="you@example.com"
                aria-invalid={!!error}
                className={getInputClasses(!!error)}
              />
            </div>
              
            <div>
              <label className="text-sm mb-1 block text-gray-700">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Your password"
                aria-invalid={!!error}
                className={getInputClasses(!!error)}
              />
            </div>
              
            {error && (
              <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">
                {error}
              </div>
            )}
          
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2 rounded-lg font-semibold text-white transition ${
                loading
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-[#00C4B4] hover:bg-teal-600'
              }`}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
