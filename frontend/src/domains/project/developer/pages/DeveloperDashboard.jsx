import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { NavLink } from "react-router-dom";
import { logoutUser } from "../../../auth/features/authThunks";
import apiClient from "../../../../api/apiClient";
import StatusUpdateModal from "./StatusUpdateModal";
import NotificationPanel from "../../../../components/notifications/NotificationPanel";
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
        <NavLink to="/profile" className="block hover:text-[#00C4B4]">
          Profile
        </NavLink>
        <button
          onClick={() => dispatch(logoutUser())}
          className="mt-auto w-full bg-[#00C4B4] hover:bg-teal-600 text-white py-2 rounded transition"
        >
          Logout
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-10">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold">Your Projects & Tasks</h1>
          <NotificationPanel />
        </div>

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
          <>
            {(!projects.active_projects.length && !projects.past_projects.length) ? (
              <div className="text-gray-500 text-center mt-10 text-lg">
                🛈 You are not part of any projects.
              </div>
            ) : (
              <div className="space-y-8">
                {/* Active Projects */}
                {projects.active_projects.map((project) => {
                  const tasksWithSubtasks = project.tasks.filter((t) => t.subtasks.length > 0);
        
                  return (
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
        
                      {tasksWithSubtasks.length === 0 ? (
                        <p className="text-sm text-gray-500 ml-1">🛈 No subtasks assigned in this project.</p>
                      ) : (
                        <div className="space-y-4 mt-4">
                          {tasksWithSubtasks.map((task) => (
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
                  );
                })}
        
                {/* Past Projects */}
                <h2 className="text-lg font-bold mt-12">Past Projects</h2>
                {projects.past_projects.length === 0 ? (
                  <p className="text-sm text-gray-500 mt-2">No past projects.</p>
                ) : (
                  projects.past_projects.map((project) => {
                    const tasksWithSubtasks = project.tasks.filter((t) => t.subtasks.length > 0);
        
                    return (
                      <div
                        key={project.id}
                        className="p-6 rounded border shadow bg-gray-50 border-gray-300 opacity-80"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <h2 className="text-xl font-semibold text-gray-700">{project.name}</h2>
                          <span className="text-sm text-gray-500">
                            {project.tasks.length} task{project.tasks.length !== 1 ? "s" : ""}
                          </span>
                        </div>
        
                        {tasksWithSubtasks.length === 0 ? (
                          <p className="text-sm text-gray-500 ml-1">🛈 No subtasks were assigned in this project.</p>
                        ) : (
                          <div className="space-y-4 mt-4">
                            {tasksWithSubtasks.map((task) => (
                              <div key={task.id} className="bg-white p-4 rounded border">
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
                                          <span className="text-xs text-gray-400">Past Project</span>
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
                    );
                  })
                )}
              </div>
            )}
          </>
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
      <NavLink
        to="/chat"
        className="fixed bottom-6 right-6 bg-[#00C4B4] text-white px-4 py-3 rounded-full shadow-lg hover:bg-teal-600 transition flex items-center space-x-2 z-50"
      >
        <span>💬</span>
        <span className="font-semibold">Chat</span>
      </NavLink>
    </div>
  );
};

export default DeveloperDashboard;