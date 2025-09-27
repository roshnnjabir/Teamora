import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import apiClient from "../../api/apiClient";
import { setUser } from "./features/authSlice";
import logo from "../../assets/teamora/teamora.png";
import { getInputClasses } from "../../styles/formClasses";
import Toast from "../../components/modals/Toast";
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [tenantValidating, setTenantValidating] = useState(true);
  const [tenantExists, setTenantExists] = useState(false);
  const [tenantError, setTenantError] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const hostname = window.location.hostname;
  const subdomain = hostname.split(".")[0];
  const isRootDomain =
    hostname === "teamora.website" || hostname === "localhost";

  // Tenant validation
  useEffect(() => {
    const validateTenant = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/tenant/validate-tenant-name/`);
        if (res.data.exists) {
          // Optional: handle schema name
          if (res.data.schema === "public" && !isRootDomain) {
            // Root/public schema but accessed via subdomain
            setTenantExists(false);
            setTenantError("Invalid workspace URL for public tenant.");
            setToastMessage("This URL does not belong to any workspace.");
            setToastOpen(true);
            navigate("/");
          } else {
            setTenantExists(true);
          }
        } else {
          setTenantExists(false);
          setTenantError(res.data.detail || "Tenant does not exist.");
          setToastMessage("Tenant does not exist. Please check your workspace URL.");
          setToastOpen(true);
          navigate("/");
        }
      } catch (err) {
        setTenantExists(false);
        setTenantError("Tenant validation failed.");
        setToastMessage("Error validating tenant. Try again later.");
        setToastOpen(true);
        navigate("/");
      } finally {
        setTenantValidating(false);
      }
    };

    validateTenant();
  }, [subdomain, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Login API call
      await apiClient.post("/api/token/", { email, password });

      // Get user info
      const userRes = await apiClient.get("/api/me/");
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
        case "super_admin":
          if (!isRootDomain) {
            setError("Super Admin must log in from teamora.website");
            return;
          }
          navigate("/super_admin");
          break;

        case "tenant_admin":
        case "project_manager":
        case "developer":
        case "hr":
          if (isRootDomain) {
            setError("Tenant users must log in from their workspace subdomain.");
            return;
          }
          navigate(`/${user.role}`);
          break;

        default:
          navigate("/");
      }
    } catch (err) {
      const message =
        err?.response?.data?.non_field_errors?.[0] ||
        err?.response?.data?.detail ||
        Object.values(err?.response?.data || {})?.[0] ||
        "Login failed.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (tenantValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div
          className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4"
          style={{ borderColor: "#00C4B4" }}
        ></div>
      </div>
    );
  }

  if (!tenantExists) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-red-600 text-center">{tenantError}</p>
        <Toast
          show={toastOpen}
          message={toastMessage}
          onClose={() => setToastOpen(false)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB] px-4">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Left - Logo/Image */}
        <div className="hidden md:block">
          <img src={logo} alt="Login Visual" className="w-full h-full object-cover" />
        </div>

        {/* Right - Login Form */}
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
                loading ? "bg-gray-300 cursor-not-allowed" : "bg-[#00C4B4] hover:bg-teal-600"
              }`}
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
        </div>
      </div>
      <Toast
        show={toastOpen}
        message={toastMessage}
        onClose={() => setToastOpen(false)}
      />
    </div>
  );
}