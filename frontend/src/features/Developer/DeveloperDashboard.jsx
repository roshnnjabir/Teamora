import { useDispatch } from "react-redux";
import { logoutUser } from "../Auth/authThunks";
import { useState } from "react";

const DeveloperDashboard = () => {
  const dispatch = useDispatch();
  const [showNotification, setShowNotification] = useState(true);

  const handleLogout = () => {
    dispatch(logoutUser());
  };

  return (
    <div className="flex min-h-screen bg-[#F9FAFB] text-[#1A2A44]">
      {/* Sidebar */}
      <aside className="w-64 bg-[#1A2A44] text-white p-6 space-y-6">
        <h2 className="text-2xl font-bold">Dev Console</h2>
        <nav className="space-y-4">
          <a href="/" className="block hover:text-[#00C4B4]">Dashboard</a>
          <a href="#" className="block hover:text-[#00C4B4]">My Tasks</a>
          <a href="#" className="block hover:text-[#00C4B4]">Code Reviews</a>
          <a href="#" className="block hover:text-[#00C4B4]">Commits</a>
        </nav>
        <button
          onClick={handleLogout}
          className="mt-auto w-full bg-[#00C4B4] hover:bg-teal-600 text-white py-2 rounded transition"
        >
          Logout
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-0 md:p-10 relative">
        {/* Notification Bar */}
        {showNotification && (
          <div className="bg-[#FF6F61] text-white px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2"
                viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M13 16h-1v-4h-1m1-4h.01M12 6a9 9 0 11-9 9 9 9 0 019-9z" />
              </svg>
              <p className="text-sm font-medium">⚠️ Scheduled maintenance at 8 PM today.</p>
            </div>
            <button
              onClick={() => setShowNotification(false)}
              className="text-white hover:text-gray-200 text-sm"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Page Content */}
        <div className="p-6 md:p-0">
          <h1 className="text-3xl font-bold text-[#2F3A4C] mb-2">Developer Dashboard</h1>
          <p className="text-[#2F3A4C] mb-6">Welcome, Developer! Here's your overview.</p>

          {/* Developer Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow border border-[#B0B8C5]">
              <h3 className="text-lg font-semibold text-[#2F3A4C] mb-2">Open Tasks</h3>
              <p className="text-2xl font-bold text-[#FF6F61]">8</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow border border-[#B0B8C5]">
              <h3 className="text-lg font-semibold text-[#2F3A4C] mb-2">Pending Reviews</h3>
              <p className="text-2xl font-bold text-[#FBBF24]">3</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow border border-[#B0B8C5]">
              <h3 className="text-lg font-semibold text-[#2F3A4C] mb-2">Commits Today</h3>
              <p className="text-2xl font-bold text-[#34D399]">17</p>
            </div>
          </div>

          {/* Task Feed */}
          <section className="mt-10">
            <h2 className="text-2xl font-semibold text-[#2F3A4C] mb-4">Recent Activity</h2>
            <div className="bg-[#E5E8EC] p-4 rounded shadow text-[#2F3A4C]">
              <p className="text-sm text-[#B0B8C5]">You’ve pushed 3 commits to the "auth-refactor" branch.</p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default DeveloperDashboard;
