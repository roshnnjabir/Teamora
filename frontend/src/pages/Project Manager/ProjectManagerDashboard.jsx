import { useDispatch } from "react-redux";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { logoutUser } from "../../features/Auth/authThunks";
import CreateProjectModal from "./CreateProjectModal";
import apiClient from "../../contexts/apiClient";

const PmDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await apiClient.get("/api/projects/");
        setProjects(response.data);
      } catch (err) {
        const message = err?.response?.data?.detail || "Failed to fetch projects.";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);


  const handleLogout = () => {
    dispatch(logoutUser());
  };

  return (
    <div className="flex min-h-screen bg-[#F9FAFB] text-[#1A2A44]">
      {/* Sidebar */}
      <aside className="w-64 bg-[#1A2A44] text-white p-6 space-y-6">
        <h2 className="text-2xl font-bold">Manager Panel</h2>
        <nav className="space-y-4">
          <a href="#" className="block hover:text-[#00C4B4]">Dashboard</a>
          <a href="#" className="block hover:text-[#00C4B4]">Projects</a>
          <a href="#" className="block hover:text-[#00C4B4]">Teams</a>
          <a href="#" className="block hover:text-[#00C4B4]">Reports</a>
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
        <h1 className="text-3xl font-bold text-[#2F3A4C] mb-2">Project Manager Dashboard</h1>
        <p className="text-[#2F3A4C] mb-6">Welcome, Project Manager! Here's your overview.</p>

        {/* Button to open modal */}
        <div className="mb-4 flex justify-end">
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-[#00C4B4] hover:bg-teal-600 text-white px-4 py-2 rounded"
          >
            + Create Project
          </button>
        </div>

        {/* Modal */}
        {showCreateModal && (
          <CreateProjectModal
            onClose={() => setShowCreateModal(false)}
          />
        )}

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow border border-[#B0B8C5]">
            <h3 className="text-lg font-semibold text-[#2F3A4C] mb-2">Active Projects</h3>
            <p className="text-2xl font-bold text-[#00C4B4]">12</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow border border-[#B0B8C5]">
            <h3 className="text-lg font-semibold text-[#2F3A4C] mb-2">Pending Approvals</h3>
            <p className="text-2xl font-bold text-[#FBBF24]">4</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow border border-[#B0B8C5]">
            <h3 className="text-lg font-semibold text-[#2F3A4C] mb-2">Team Members</h3>
            <p className="text-2xl font-bold text-[#34D399]">23</p>
          </div>
        </div>

        {/* Project List Section */}
        <section className="mt-10">
          <h2 className="text-2xl font-semibold text-[#2F3A4C] mb-4">Current Projects</h2>
          <div className="bg-white p-4 rounded shadow text-[#2F3A4C] space-y-4 border border-[#B0B8C5]">
            {loading ? (
              <p>Loading projects...</p>
            ) : error ? (
              <p className="text-red-500">{error}</p>
            ) : projects.length === 0 ? (
              <p className="text-sm text-[#B0B8C5]">No projects found.</p>
            ) : (
              projects.map((project) => (
                <div
                  key={project.id}
                  onClick={() => navigate(`/project_manager/projects/${project.id}`)}
                  className="p-4 border-b border-[#E5E8EC] cursor-pointer hover:bg-[#F3F4F6] rounded transition"
                >
                  <h3 className="text-lg font-semibold">{project.name}</h3>
                  <p className="text-sm text-[#6B7280]">{project.description}</p>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default PmDashboard;
