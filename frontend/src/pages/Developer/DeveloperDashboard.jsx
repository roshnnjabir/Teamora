import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { logoutUser } from "../../features/Auth/authThunks";
import apiClient from "../../contexts/apiClient";
import StatusUpdateModal from "./StatusUpdateModal";
import { format } from "date-fns";

const DeveloperDashboard = () => {
  const dispatch = useDispatch();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedSubtask, setSelectedSubtask] = useState(null);
  const [notification, setNotification] = useState({ message: "", type: "" });

  const fetchDashboard = async () => {
    try {
      const res = await apiClient.get("/api/developer-dashboard/");
      setProjects(res.data);
    } catch (err) {
      setError("Failed to load dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleStatusUpdate = async (subtaskId, newStatus) => {
    try {
      await apiClient.patch(`/api/subtasks/${subtaskId}/`, { status: newStatus });
      showNotification("Status updated successfully");
      fetchDashboard();
    } catch (err) {
      const msg = err?.response?.data?.detail || "Update failed.";
      showNotification(msg, "error");
    }
  };

  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification({ message: "", type: "" }), 3000);
  };

  return (
    <div className="flex min-h-screen bg-[#F9FAFB] text-[#1A2A44]">
      {/* Sidebar */}
      <aside className="w-64 bg-[#1A2A44] text-white p-6 space-y-6">
        <h2 className="text-2xl font-bold">Developer</h2>
        <nav className="space-y-4">
          <span className="block hover:text-[#00C4B4]">Dashboard</span>
        </nav>
        <button
          onClick={() => dispatch(logoutUser())}
          className="mt-auto w-full bg-[#00C4B4] hover:bg-teal-600 text-white py-2 rounded transition"
        >
          Logout
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-10">
        <h1 className="text-3xl font-bold mb-4">Your Projects & Tasks</h1>

        {notification.message && (
          <div className={`mb-4 p-3 rounded ${notification.type === "success" ? "bg-green-500" : "bg-red-500"} text-white`}>
            {notification.message}
          </div>
        )}

        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : (
          <div className="space-y-8">
            {projects.map((project) => (
              <div
                key={project.id}
                className={`p-6 rounded border shadow ${
                  project.is_active ? "bg-white border-gray-300" : "bg-gray-100 border-gray-400 opacity-70"
                }`}
              >
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-xl font-semibold">
                    {project.name}
                    {!project.is_active && (
                      <span className="ml-3 px-2 py-1 text-xs bg-gray-400 text-white rounded">Inactive</span>
                    )}
                  </h2>
                  <span className="text-sm text-gray-500">
                    {project.tasks.length} task{project.tasks.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {project.tasks.length === 0 ? (
                  <p className="text-sm text-gray-500 ml-1">No subtasks assigned in this project.</p>
                ) : (
                  <div className="space-y-4 mt-4">
                    {project.tasks.map((task) => (
                      <div key={task.id} className="bg-[#F9FAFC] p-4 rounded border">
                        <h3 className="font-medium text-[#1A2A44] mb-2">{task.name}</h3>
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-left text-[#2F3A4C]">
                              <th className="py-1">Subtask</th>
                              <th className="py-1">Status</th>
                              <th className="py-1">Due Date</th>
                              <th className="py-1">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {task.subtasks.map((sub) => (
                              <tr key={sub.id} className="border-t">
                                <td className="py-2">{sub.title}</td>
                                <td className="py-2 capitalize">{sub.status.replace("_", " ")}</td>
                                <td className="py-2">
                                  {sub.due_date ? format(new Date(sub.due_date), "dd MMM yyyy") : "N/A"}
                                </td>
                                <td className="py-2">
                                  {project.is_active ? (
                                    <button
                                      onClick={() => setSelectedSubtask(sub)}
                                      className="text-[#00C4B4] hover:underline text-sm"
                                    >
                                      Update Status
                                    </button>
                                  ) : (
                                    <span className="text-xs text-gray-400">Inactive</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {selectedSubtask && (
          <StatusUpdateModal
            task={selectedSubtask}
            onClose={() => setSelectedSubtask(null)}
            onSave={(status) => {
              handleStatusUpdate(selectedSubtask.id, status);
              setSelectedSubtask(null);
            }}
          />
        )}
      </main>
    </div>
  );
};

export default DeveloperDashboard;