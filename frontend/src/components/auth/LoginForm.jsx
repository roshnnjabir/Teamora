import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser } from '../../api/auth/loginUser';
import apiClient from '../../contexts/apiClient';
import { setUser } from '../../features/Auth/authSlice';
import logo from '../../assets/teamora/teamora.png';

export default function LoginForm() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchUserInfo = async () => {
    const response = await apiClient.get('/api/me/');
    console.log(response.data);
    return response.data;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
  
    try {
      await loginUser(email, password);
      const user = await fetchUserInfo();
    
      const roleMap = {
        super_admin: "Super Admin",
        tenant_admin: "Tenant Admin",
        project_manager: "Project Manager",
        hr: "HR",
        developer: "Developer",
      };
    
      dispatch(setUser({ ...user, displayRole: roleMap[user.role] || user.role }));
    
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
      }
    } catch (err) {
      console.error("Login error:", err);
    
      let message = 'Login failed. Please try again.';
    
      if (err.response?.data?.detail) {
        message = err.response.data.detail;
      } else if (typeof err.response?.data === 'string') {
        message = err.response.data;
      } else if (typeof err.message === 'string') {
        message = err.message;
      }
    
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
              <label className="text-sm mb-1 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full px-3 py-2 rounded-md border border-[#B0B8C5] bg-[#E5E8EC] focus:outline-none focus:ring-1 focus:ring-[#00C4B4]"
              />
            </div>

            <div>
              <label className="text-sm mb-1 block">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="Your password"
                className="w-full px-3 py-2 rounded-md border border-[#B0B8C5] bg-[#E5E8EC] focus:outline-none focus:ring-1 focus:ring-[#00C4B4]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2 rounded-md font-medium text-white transition ${
                loading
                  ? 'bg-[#B0B8C5] cursor-not-allowed'
                  : 'bg-[#00C4B4] hover:bg-teal-600'
              }`}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>

            {error && (
              <div className="text-center mt-4 bg-red-100 text-red-700 py-2 px-3 rounded-md">
                {error}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
