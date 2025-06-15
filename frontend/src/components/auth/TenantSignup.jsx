import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/logo.jpeg'

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

      setSuccess('Tenant created successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB]">
      <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 shadow-2xl rounded-2xl overflow-hidden bg-white">

        {/* Left Side Image */}
        <div className="hidden md:block">
          <img
            src={logo}
            alt="Signup Illustration"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Right Side Form */}
        <form
          onSubmit={handleSubmit}
          className="p-8 md:p-10 bg-white text-[#1A2A44] opacity-0 animate-fade-in-up"
        >
          <h2 className="text-3xl font-bold mb-6 text-center">Tenant Signup</h2>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Tenant Name</label>
            <input
              type="text"
              placeholder="e.g. Acme Inc"
              value={tenantName}
              onChange={e => setTenantName(e.target.value)}
              required
              className="w-full px-4 py-2 rounded-lg bg-[#E5E8EC] border border-[#B0B8C5] focus:outline-none focus:ring-2 focus:ring-[#00C4B4]"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Subdomain</label>
            <div className="flex items-center">
              <input
                type="text"
                placeholder="e.g. brototype"
                value={subdomain}
                onChange={e => setSubdomain(e.target.value.replace(/\s+/g, '').toLowerCase())}
                required
                className="flex-grow px-4 py-2 rounded-lg bg-[#E5E8EC] border border-[#B0B8C5] focus:outline-none focus:ring-2 focus:ring-[#00C4B4]"
              />
              <span className="ml-2 text-sm text-[#B0B8C5] select-none">.localhost.com</span>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Admin Full Name</label>
            <input
              type="text"
              placeholder="Admin User"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              required
              className="w-full px-4 py-2 rounded-lg bg-[#E5E8EC] border border-[#B0B8C5] focus:outline-none focus:ring-2 focus:ring-[#00C4B4]"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Admin Email</label>
            <input
              type="email"
              placeholder="admin@acme.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 rounded-lg bg-[#E5E8EC] border border-[#B0B8C5] focus:outline-none focus:ring-2 focus:ring-[#00C4B4]"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              placeholder="Your secure password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 rounded-lg bg-[#E5E8EC] border border-[#B0B8C5] focus:outline-none focus:ring-2 focus:ring-[#00C4B4]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-lg text-white font-semibold transition-colors ${
              loading
                ? 'bg-[#B0B8C5] cursor-not-allowed'
                : 'bg-[#00C4B4] hover:bg-teal-600'
            }`}
          >
            {loading ? 'Signing up...' : 'Signup'}
          </button>

          {error && (
            <p className="mt-4 text-sm text-center text-[#EF4444]">{error}</p>
          )}
          {success && (
            <p className="mt-4 text-sm text-center text-[#34D399]">{success}</p>
          )}
        </form>
      </div>
    </div>
  );
}
