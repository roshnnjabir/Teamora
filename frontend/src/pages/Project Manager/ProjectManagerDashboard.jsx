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
  const [myDevelopers, setMyDevelopers] = useState([]);

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

  const fetchDevelopers = async () => {
    try {
      const res = await apiClient.get("/api/my-developers/");
      setMyDevelopers(res.data);
    } catch (err) {
      console.error("Failed to fetch developers", err);
    }
  };

  useEffect(() => {
    const controller = new AbortController();

    fetchProjects();
    fetchDevelopers();

    return () => controller.abort();
  }, []);

  const handleLogout = () => {
    dispatch(logoutUser());
  };

  const getInitials = (name) => {
    if (!name) return "";
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  };

  const activeProjects = projects.filter((p) => p.is_active).length;
  const teamMembers = new Set(projects.flatMap((p) => (p.members || []).map((m) => m.id))).size;
  const pendingApprovals = 0;

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

        {/* Create Button */}
        <div className="mb-4 flex justify-end">
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-[#00C4B4] hover:bg-teal-600 text-white px-4 py-2 rounded"
          >
            + Create Project
          </button>
        </div>

        {showCreateModal && (
          <CreateProjectModal
            onClose={() => setShowCreateModal(false)}
            onSuccess={fetchProjects}
          />
        )}

        {/* Dynamic Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow border border-[#B0B8C5]">
            <h3 className="text-lg font-semibold text-[#2F3A4C] mb-2">Active Projects</h3>
            <p className="text-2xl font-bold text-[#00C4B4]">{activeProjects}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow border border-[#B0B8C5]">
            <h3 className="text-lg font-semibold text-[#2F3A4C] mb-2">Pending Approvals</h3>
            <p className="text-2xl font-bold text-[#FBBF24]">{pendingApprovals}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow border border-[#B0B8C5]">
            <h3 className="text-lg font-semibold text-[#2F3A4C] mb-2">Team Members</h3>
            <p className="text-2xl font-bold text-[#34D399]">{teamMembers}</p>
          </div>
        </div>

        {/* Project List Section */}
        <section className="mt-10">
          <h2 className="text-2xl font-semibold text-[#2F3A4C] mb-4">Current Projects</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                  className="bg-white p-4 rounded shadow border border-[#E5E8EC] hover:bg-[#F3F4F6] cursor-pointer transition"
                >
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-bold">{project.name}</h3>
                    <span className="text-sm px-2 py-1 rounded-full bg-blue-100 text-blue-600 capitalize">
                      {project.status || 'planning'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    {project.description?.length > 100
                      ? `${project.description.slice(0, 100)}...`
                      : project.description}
                  </p>
                  <p className="text-sm text-gray-500">📅 {project.start_date} - {project.end_date || 'N/A'}</p>
                  <p className="text-sm mt-1">🔥 Priority: <strong>{project.priority || 'medium'}</strong></p>
                  <div className="flex mt-4 -space-x-2">
                    {(project.members || []).slice(0, 4).map((member) => (
                      <div
                        key={member.employee.id}
                        title={member.employee.full_name}
                        className="w-8 h-8 rounded-full bg-[#00C4B4] text-white text-xs flex items-center justify-center border-2 border-white"
                      >
                        {getInitials(member.employee.full_name)}
                      </div>
                    ))}
                    {project.members?.length > 4 && (
                      <div className="w-8 h-8 rounded-full bg-gray-300 text-xs flex items-center justify-center border-2 border-white">
                        +{project.members.length - 4}
                      </div>
                    )}
                    {project.members?.length === 0 && (
                      <p className="text-xs text-gray-400 mt-2">No members yet.</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-semibold text-[#2F3A4C] mb-4">Your Developers</h2>
          {myDevelopers.length === 0 ? (
            <p className="text-gray-500">No developers assigned to you.</p>
          ) : (
            <div className="flex flex-wrap gap-4">
              {myDevelopers.map((dev) => (
                <div key={dev.id} className="bg-white p-3 rounded shadow border w-60">
                  <h4 className="font-semibold">{dev.full_name}</h4>
                  <p className="text-sm text-gray-500">{dev.email}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default PmDashboard;
