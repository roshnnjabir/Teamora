import { useDispatch } from "react-redux";
import { logoutUser } from "../Auth/authThunks";

const HrDashboard = () => {
  const dispatch = useDispatch();

  const handleLogout = () => {
    dispatch(logoutUser());
  };

  return (
    <div className="flex min-h-screen bg-[#F9FAFB] text-[#1A2A44]">
      {/* Sidebar */}
      <aside className="w-64 bg-[#1A2A44] text-white p-6 space-y-6">
        <h2 className="text-2xl font-bold">HR Panel</h2>
        <nav className="space-y-4">
          <a href="#" className="block hover:text-[#00C4B4]">Dashboard</a>
          <a href="#" className="block hover:text-[#00C4B4]">Employees</a>
          <a href="#" className="block hover:text-[#00C4B4]">Leave Requests</a>
          <a href="#" className="block hover:text-[#00C4B4]">Recruitment</a>
        </nav>
        <button
          onClick={handleLogout}
          className="mt-auto w-full bg-[#00C4B4] hover:bg-teal-600 text-white py-2 rounded transition"
        >
          Logout
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-10">
        <h1 className="text-3xl font-bold text-[#2F3A4C] mb-2">HR Manager Dashboard</h1>
        <p className="text-[#2F3A4C] mb-6">Welcome, Human Resource Manager! Here's your overview.</p>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow border border-[#B0B8C5]">
            <h3 className="text-lg font-semibold text-[#2F3A4C] mb-2">Employees</h3>
            <p className="text-2xl font-bold text-[#00C4B4]">78</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow border border-[#B0B8C5]">
            <h3 className="text-lg font-semibold text-[#2F3A4C] mb-2">Pending Leave Requests</h3>
            <p className="text-2xl font-bold text-[#FBBF24]">6</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow border border-[#B0B8C5]">
            <h3 className="text-lg font-semibold text-[#2F3A4C] mb-2">New Applications</h3>
            <p className="text-2xl font-bold text-[#34D399]">9</p>
          </div>
        </div>

        {/* Leave Info Section */}
        <section className="mt-10">
          <h2 className="text-2xl font-semibold text-[#2F3A4C] mb-4">Leave Info</h2>
          <div className="bg-[#E5E8EC] p-4 rounded shadow text-[#2F3A4C]">
            <p className="text-sm text-[#B0B8C5]">Detailed leave data will appear here. You can track employee leave balances, pending approvals, and leave trends.</p>
          </div>
        </section>
      </main>
    </div>
  );
};

export default HrDashboard;
