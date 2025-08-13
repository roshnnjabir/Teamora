import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;
const FIND_WORKSPACE_ENDPOINT = `${BASE_URL}/api/tenants/find-workspace/`;

const validateEmail = (email) =>
  /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);

export default function AccessWorkspace() {
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [redirectCountdown, setRedirectCountdown] = useState(null);

  const countdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (redirectCountdown === null) return;
    if (redirectCountdown <= 0) {
      navigate("/");
      return;
    }

    countdownRef.current = setTimeout(() => {
      setRedirectCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(countdownRef.current);
  }, [redirectCountdown, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched(true);
    setError("");
    setSuccess("");

    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(FIND_WORKSPACE_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(
          data.detail ||
            data.error ||
            "Unable to process request. Please try again later."
        );
      } else {
        const msg =
          data.detail ||
          `If a workspace exists for ${email.trim()}, we've sent an email with login instructions.`;
        setSuccess(msg);
        setRedirectCountdown(5);
      }
    } catch (err) {
      setError("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4">
      <div className="absolute top-6 left-6">
        <button
          onClick={() => {
            if (window.history.length > 1) {
              navigate(-1); // go back if history exists
            } else {
              navigate('/'); // fallback to home
            }
          }}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-white border border-gray-300 hover:bg-gray-100 transition-colors"
          aria-label="Go back"
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


      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link
            to="/"
            className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl mb-4 shadow-lg hover:scale-105 transition-transform"
          >
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 9.75L12 3l9 6.75V21a1 1 0 01-1 1h-5.25a1 1 0 01-1-1v-4.5h-4.5V21a1 1 0 01-1 1H4a1 1 0 01-1-1V9.75z"
              />
            </svg>
          </Link>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Access Your Workspace
          </h1>
          <p className="text-gray-600">
            Enter your email to receive your login link
          </p>
        </div>


        {/* Card */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Work Email *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched(true)}
                placeholder="you@company.com"
                className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none bg-white/70 ${
                  error
                    ? "border-red-300 focus:border-red-500"
                    : "border-gray-200 focus:border-blue-500"
                }`}
                disabled={loading || redirectCountdown !== null}
                autoFocus
              />
              {touched && email && !validateEmail(email) && (
                <p className="mt-2 text-sm text-red-600">
                  Enter a valid email address.
                </p>
              )}
              {error && (
                <p className="mt-2 text-sm text-red-600">{error}</p>
              )}
            </div>

            {/* Success Message */}
            {success && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
                {success}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={
                loading ||
                !validateEmail(email) ||
                redirectCountdown !== null
              }
              className={`w-full py-3 rounded-xl font-semibold text-white shadow-lg transition-all duration-200 ${
                loading ||
                !validateEmail(email) ||
                redirectCountdown !== null
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
              }`}
            >
              {loading ? (
                <div className="flex justify-center items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Sending...</span>
                </div>
              ) : redirectCountdown !== null ? (
                `Redirecting in ${redirectCountdown}s`
              ) : (
                "Send Workspace Link"
              )}
            </button>

            <div className="text-center">
              <Link
                to="/"
                className="inline-block text-sm text-gray-600 hover:text-blue-600 font-medium transition-colors"
              >
                ← Back to Home
              </Link>
            </div>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center mt-8 text-gray-600 text-sm">
          Don’t have a workspace?{" "}
          <Link
            to="/signup"
            className="text-blue-600 hover:text-blue-700 font-semibold transition-colors"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
