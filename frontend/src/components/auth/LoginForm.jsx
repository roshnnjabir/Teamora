import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import apiClient, { loginUser } from '../../api/auth/login';
import { setUser } from '../../features/Auth/authSlice';

const LoginForm = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // helper to fetch user info from /api/me
  const fetchUserInfo = async () => {
      try {
        const response = await apiClient.get('/api/me/');
        return response.data;
      } catch (error) {
        throw new Error('Failed to fetch user info');
      }
    };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await loginUser(email, password);

      // fetch user info from /api/me using cookies
      const user = await fetchUserInfo();

      const roleMap = {
        super_admin: "Super Admin",
        tenant_admin: "Tenant Admin",
        project_manager: "Project Manager",
        hr: "HR",
        developer: "Developer"
      };

      dispatch(
        setUser({
          ...user,
          displayRole: roleMap[user.role] || user.role,
        })
      );

      switch (user.role) {
        case 'tenant_admin':
          navigate('/admin');
          break;
        case 'project_manager':
          navigate('/project_manager');
          break;
        case 'developer':
          navigate('/developer');
          break;
        case 'hr':
          navigate('/hr');
          break;
        default:
          navigate('/dashboard');
      }
    } catch (err) {
      setError(err?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-lg shadow-md w-full max-w-md"
      >
        <h2 className="text-2xl font-semibold mb-6 text-center text-gray-800">Login</h2>

        <input
          type="email"
          value={email}
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full p-3 border border-gray-300 rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <input
          type="password"
          value={password}
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full p-3 border border-gray-300 rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 rounded text-white transition duration-200 ${
            loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>

        {error && (
          <p className="mt-4 text-red-600 text-sm text-center">{error}</p>
        )}
      </form>
    </div>
  );
};

export default LoginForm;
