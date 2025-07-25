import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import apiClient from "../../../api/apiClient";
import InlineEditField from "../../../components/common/InlineEditField";

const UserProfilePage = () => {
  const user = useSelector((state) => state.auth.user);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [passwordData, setPasswordData] = useState({
    old_password: "",
    new_password: "",
  });
  const [passwordError, setPasswordError] = useState(null);
  const [passwordSuccess, setPasswordSuccess] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await apiClient.get("/api/profile/");
        setProfile(res.data);
      } catch (err) {
        console.error("Failed to load profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleSave = async (field, value) => {
    try {
      const res = await apiClient.put("/api/profile/", {
        ...profile,
        [field]: value,
      });
      setProfile(res.data);
    } catch (err) {
      console.error("Save failed:", err);
      return {
        [field]: ["Update failed. Please try again."],
      };
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    try {
      await apiClient.post("/api/password/change/", passwordData);
      setPasswordSuccess("Password updated successfully.");
      setPasswordData({ old_password: "", new_password: "" });
    } catch (err) {
      console.error("Password change error:", err);
      const msg =
        err.response?.data?.old_password?.[0] ||
        err.response?.data?.new_password?.[0] ||
        err.response?.data?.detail ||
        "Failed to change password.";
      setPasswordError(msg);
    }
  };

  const getInitials = (name = "") =>
    name?.split(" ").map((n) => n[0]).join("").toUpperCase();

  if (!user || loading || !profile) {
    return <div className="p-6 text-[#B0B8C5]">Loading profile...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto py-10 px-6 bg-[#F9FAFB] min-h-screen">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="text-sm text-[#2F3A4C] hover:text-[#1A2A44] mb-4 flex items-center space-x-1"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        <span>Back</span>
      </button>

      {/* Profile Card */}
      <div className="bg-white border border-[#E5E8EC] rounded-lg shadow p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-6">
          <div className="w-16 h-16 bg-[#00C4B4] text-white rounded-full flex items-center justify-center text-xl font-bold">
            {getInitials(user.name)}
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-[#1A2A44]">{user.name}</h1>
            <p className="text-[#2F3A4C]">{user.email}</p>
            <p className="mt-1 text-sm text-[#00C4B4] font-medium">
              Role: {user.displayRole}
            </p>
          </div>
        </div>

        {/* Editable Field: Full Name */}
        <InlineEditField
          name="full_name"
          label="Full Name"
          value={profile.full_name}
          onSave={(val) => handleSave("full_name", val)}
        />

        {/* Read-only Fields */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#2F3A4C]">Job Title</label>
            <p className="mt-1 text-[#1A2A44]">{profile.job_title || "—"}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#2F3A4C]">Department</label>
            <p className="mt-1 text-[#1A2A44]">{profile.department || "—"}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#2F3A4C]">Date Joined</label>
            <p className="mt-1 text-[#1A2A44]">
              {profile.date_joined ? new Date(profile.date_joined).toLocaleDateString() : "—"}
            </p>
          </div>
        </div>

        {/* Change Password Section */}
        <div className="pt-6 border-t border-[#E5E8EC]">
          <h3 className="text-lg font-semibold text-[#1A2A44] mb-2">Change Password</h3>

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-sm text-[#2F3A4C]">Current Password</label>
              <input
                type="password"
                value={passwordData.old_password}
                onChange={(e) => setPasswordData({ ...passwordData, old_password: e.target.value })}
                required
                className="w-full mt-1 border border-[#E5E8EC] rounded-md px-3 py-2 text-sm text-[#1A2A44] focus:outline-none focus:ring-2 focus:ring-[#00C4B4]"
              />
            </div>

            <div>
              <label className="block text-sm text-[#2F3A4C]">New Password</label>
              <input
                type="password"
                value={passwordData.new_password}
                onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                required
                className="w-full mt-1 border border-[#E5E8EC] rounded-md px-3 py-2 text-sm text-[#1A2A44] focus:outline-none focus:ring-2 focus:ring-[#00C4B4]"
              />
            </div>

            {passwordError && (
              <div className="text-sm text-[#EF4444] bg-red-50 px-3 py-2 rounded">
                {passwordError}
              </div>
            )}

            {passwordSuccess && (
              <div className="text-sm text-[#34D399] bg-green-50 px-3 py-2 rounded">
                {passwordSuccess}
              </div>
            )}

            <button
              type="submit"
              className="bg-[#00C4B4] hover:bg-[#089e96] text-white text-sm font-semibold px-4 py-2 rounded-md"
            >
              Update Password
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;