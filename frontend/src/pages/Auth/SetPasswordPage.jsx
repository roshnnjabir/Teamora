import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import apiClient from "../../contexts/apiClient";
import { getInputClasses } from "../../styles/formClasses";

export default function SetPasswordPage() {
  const { uid, token } = useParams(); // <-- 🔁 from route
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!uid || !token) {
      setError("Invalid or missing password reset link.");
    }
  }, [uid, token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setSubmitting(true);
      await apiClient.post("/api/set-password/", {
        uid,
        token,
        new_password: newPassword,
      });
      setSuccess(true);
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        Object.values(err?.response?.data || {})?.[0] ||
        "Something went wrong.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white shadow-md p-6 rounded-lg">
        <h2 className="text-xl font-semibold text-center text-[#1A2A44]">Set New Password</h2>

        {error && <p className="mt-4 text-red-600 text-sm text-center">{error}</p>}
        {success && <p className="mt-4 text-green-600 text-sm text-center">Password set successfully! Redirecting to login...</p>}

        {!success && (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm mb-1">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className={getInputClasses(!!error)}
              />
            </div>

            <div>
              <label className="block text-sm mb-1">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className={getInputClasses(!!error)}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className={`w-full py-2 text-white rounded-md font-semibold transition ${
                submitting
                  ? "bg-[#B0B8C5] cursor-not-allowed"
                  : "bg-[#00C4B4] hover:bg-teal-600"
              }`}
            >
              {submitting ? "Setting Password..." : "Set Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
