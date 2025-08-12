// src/pages/AccessWorkspace.jsx
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;
// Endpoint expected to accept { email } and queue/send the email via celery.
// Adjust if your backend uses a different route.
const FIND_WORKSPACE_ENDPOINT = `${BASE_URL}/api/tenants/find-workspace/`;

// rate-limit / cooldown (milliseconds)
const COOLDOWN_MS = 60_000;

const validateEmail = (email) =>
  /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);

export default function AccessWorkspace() {
  const [email, setEmail] = useState('');
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const cooldownTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!cooldownUntil) return;

    cooldownTimerRef.current = setInterval(() => {
      if (Date.now() >= cooldownUntil) {
        setCooldownUntil(null);
        clearInterval(cooldownTimerRef.current);
      } else {
        // tick — we rely on derived display
      }
    }, 500);
  }, [cooldownUntil]);

  const secondsRemaining = cooldownUntil ? Math.ceil((cooldownUntil - Date.now()) / 1000) : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched(true);
    setError('');
    setSuccess('');

    if (!validateEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (cooldownUntil && Date.now() < cooldownUntil) {
      setError(`Please wait ${Math.ceil((cooldownUntil - Date.now()) / 1000)}s before trying again.`);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(FIND_WORKSPACE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        // backend error
        setError(
          data.detail ||
            data.error ||
            'Unable to process request. Please try again later.'
        );
      } else {
        // Expected backend shape examples:
        // { found: true }  => workspace found, email queued
        // { found: false } => not found
        // If backend doesn't return 'found', we show a safe generic message.
        if (data.found === true) {
          setSuccess(
            `We've found a workspace for ${email.trim()}. A sign-in link has been emailed. Please check your inbox.`
          );
        } else if (data.found === false) {
          // If you prefer not to reveal whether an account exists,
          // replace this message with a generic one (see below).
          setSuccess(
            `If a workspace exists for ${email.trim()}, we've sent an email with login instructions.`
          );
        } else {
          // Backend didn't provide explicit found flag — show safe/generic message
          setSuccess(
            `If a workspace exists for ${email.trim()}, we've sent an email with login instructions.`
          );
        }

        // start cooldown to avoid spam
        setCooldownUntil(Date.now() + COOLDOWN_MS);
      }
    } catch (err) {
      setError('Network error — please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-6">
      <div className="w-full max-w-xl">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
          <div className="px-8 py-10">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl mb-4 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v4a1 1 0 001 1h3m10 0h3a1 1 0 001-1V7M7 21h10M7 10h10" />
                </svg>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-[#1A2A44] mb-2">
                Access Your Workspace
              </h1>
              <p className="text-sm text-[#2F3A4C]">
                Enter the email address associated with your workspace — we'll email you a link.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-[#2F3A4C] mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setTouched(true)}
                  placeholder="admin@company.com"
                  className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none bg-white/70 ${
                    error ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'
                  }`}
                  disabled={loading}
                  autoFocus
                />
                {touched && email && !validateEmail(email) && (
                  <p className="mt-2 text-sm text-red-600">Enter a valid email address.</p>
                )}
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
                  {error}
                </div>
              )}

              {success && (
                <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm">
                  {success}
                </div>
              )}

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={loading || !validateEmail(email) || (cooldownUntil && Date.now() < cooldownUntil)}
                  className={`px-6 py-3 rounded-xl font-semibold text-white transition-all duration-200 shadow-lg min-w-[150px] ${
                    loading || !validateEmail(email) || (cooldownUntil && Date.now() < cooldownUntil)
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-[#00C4B4] hover:bg-teal-600'
                  }`}
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Sending...</span>
                    </div>
                  ) : cooldownUntil && Date.now() < cooldownUntil ? (
                    `Wait ${secondsRemaining}s`
                  ) : (
                    'Send Workspace Link'
                  )}
                </button>

                <Link
                  to="/"
                  className="px-5 py-3 rounded-xl font-semibold text-[#1A2A44] border-2 border-[#1A2A44] hover:bg-[#1A2A44] hover:text-white transition"
                >
                  Back to Home
                </Link>
              </div>

              <p className="text-xs text-[#B0B8C5] mt-3">
                We'll send a secure sign-in link to the email if a workspace exists. Emails are handled asynchronously by the server (Celery).
              </p>
            </form>
          </div>
        </div>

        <div className="text-center mt-6">
          <p className="text-gray-600 text-sm">
            Need help?{' '}
            <Link to="/support" className="text-[#00C4B4] font-semibold hover:underline">
              Contact Support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}