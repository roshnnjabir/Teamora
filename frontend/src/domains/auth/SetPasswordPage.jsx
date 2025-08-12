import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import apiClient from "../../api/apiClient";
import { getInputClasses } from "../../styles/formClasses";
import InfoModal from "../../components/modals/InfoModal";
import Toast from "../../components/modals/Toast";

export default function SetPasswordPage() {
  const { uid, token } = useParams(); // <-- 🔁 from route
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [validating, setValidating] = useState(true);

  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");

  useEffect(() => {
    const validateToken = async () => {
      try {
        await apiClient.post("/api/validate-set-password/", { uidb64: uid, token });
        setValidating(false);
      } catch (err) {
        setToastMessage("Your password setup link is invalid or expired.");
        setToastOpen(true);

        // Delay navigate so user sees toast
        setTimeout(() => navigate("/login"), 2500);
      }
    };

    if (uid && token) {
      validateToken();
    } else {
      navigate("/login"); // invalid URL params
    }
  }, [uid, token, navigate]);

  useEffect(() => {
    if (!uid || !token) {
      setError("Invalid or missing password reset link.");
    }
  }, [uid, token]);

  const validatePassword = (password) => {
    const errors = [];
    
    if (password.length < 8) {
      errors.push("Password must be at least 8 characters long.");
    }
    if (!/[A-Z]/.test(password)) {
      errors.push("Password must include at least one uppercase letter.");
    }
    if (!/[a-z]/.test(password)) {
      errors.push("Password must include at least one lowercase letter.");
    }
    if (!/[0-9]/.test(password)) {
      errors.push("Password must include at least one number.");
    }
    if (!/[!@#$%^&*(),.?\":{}|<>]/.test(password)) {
      errors.push("Password must include at least one special character.");
    }
  
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const validationErrors = validatePassword(newPassword);
    if (validationErrors.length > 0) {
      setError(validationErrors.join(" "));
      return;
    }

    try {
      setSubmitting(true);
      await apiClient.post("/api/set-password/", {
        uidb64: uid,
        token,
        new_password: newPassword,
      });
      setSuccess(true);
      setModalTitle("Success");
      setModalMessage("Password set successfully! Redirecting to login...");
      setModalOpen(true);
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        Object.values(err?.response?.data || {})?.[0] ||
        "Something went wrong.";

      setError(msg);
      setModalTitle("Error");
      setModalMessage(msg);
      setModalOpen(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (validating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4" style={{ borderColor: "#00C4B4" }}></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white shadow-md p-6 rounded-lg">
        <h2 className="text-xl font-semibold text-center text-[#1A2A44]">Set New Password</h2>

        {error && !modalOpen && <p className="mt-4 text-red-600 text-sm text-center">{error}</p>}
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

      <InfoModal
        open={modalOpen}
        title={modalTitle}
        message={modalMessage}
        onClose={() => setModalOpen(false)}
      />
      <Toast
        show={toastOpen}
        message={toastMessage}
        onClose={() => setToastOpen(false)}
      />
    </div>
  );
}
