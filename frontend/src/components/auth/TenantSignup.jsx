import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import logo from '../../assets/teamora/team.png';

export default function TenantSignup() {
  const [tenantName, setTenantName] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    const domainUrl = `${subdomain.toLowerCase()}.localhost`;

    const payload = {
      tenant_name: tenantName,
      domain_url: domainUrl,
      email,
      password,
      full_name: fullName,
    };

    try {
      const res = await fetch('http://localhost:8000/api/tenants/signup/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Signup failed');
      }

      setSuccess(`Tenant created successfully! A login link has been sent to your email: ${email}`);
      setTimeout(() => {
        navigate('/');
      }, 5000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB] px-4">
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 bg-white rounded-lg shadow-lg overflow-hidden">

        {/* Left - Full Image */}
        <div className="hidden md:block">
          <img
            src={logo}
            alt="Signup Visual"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Right - Form */}
        <div className="p-8 sm:p-10">
          <div className="mb-6 flex justify-between items-center">
            <h2 className="text-2xl font-semibold text-[#1A2A44]">Tenant Signup</h2>
            <Link to="/" className="text-sm text-[#00C4B4] hover:underline">← Back</Link>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm mb-1 block">Tenant Name</label>
              <input
                type="text"
                value={tenantName}
                onChange={e => setTenantName(e.target.value)}
                required
                placeholder="e.g. Acme Inc"
                className="w-full px-3 py-2 rounded-md border border-[#B0B8C5] bg-[#E5E8EC] focus:outline-none focus:ring-1 focus:ring-[#00C4B4]"
              />
            </div>

            <div>
              <label className="text-sm mb-1 block">Subdomain</label>
              <div className="flex items-center">
                <input
                  type="text"
                  value={subdomain}
                  onChange={e => setSubdomain(e.target.value.replace(/\s+/g, '').toLowerCase())}
                  required
                  placeholder="e.g. brototype"
                  className="flex-grow px-3 py-2 rounded-md border border-[#B0B8C5] bg-[#E5E8EC] focus:outline-none focus:ring-1 focus:ring-[#00C4B4]"
                />
                <span className="ml-2 text-sm text-[#B0B8C5]">.localhost</span>
              </div>
            </div>

            <div>
              <label className="text-sm mb-1 block">Admin Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                required
                placeholder="Admin User"
                className="w-full px-3 py-2 rounded-md border border-[#B0B8C5] bg-[#E5E8EC] focus:outline-none focus:ring-1 focus:ring-[#00C4B4]"
              />
            </div>

            <div>
              <label className="text-sm mb-1 block">Admin Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="admin@acme.com"
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
                placeholder="Your secure password"
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
              {loading ? 'Signing up...' : 'Signup'}
            </button>

            {error && (
              <p className="text-sm text-[#EF4444] text-center mt-2">{error}</p>
            )}
            {success && (
              <p className="text-sm text-[#34D399] text-center mt-2">{success}</p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
