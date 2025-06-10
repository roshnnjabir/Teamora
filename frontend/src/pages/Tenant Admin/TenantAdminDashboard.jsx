import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { logoutUser } from "../../features/Auth/authThunks";
import { format } from "date-fns";
import apiClient from "../../contexts/apiClient";
import PMDeveloperAssignmentManager from "./PMDeveloperAssignmentManager";
import EmployeeFormModal from "./EmployeeFormModal";
import CreateProjectModal from "./CreateProjectModal";
import SubtaskBlockToast from "../../components/Modals/SubTaskBlockToast";
import { useNavigate } from "react-router-dom";


const TenantAdminDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [refreshAssignments, setRefreshAssignments] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [nextPage, setNextPage] = useState(null);
  const [prevPage, setPrevPage] = useState(null);
  const [filters, setFilters] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [formError, setFormError] = useState("");
  const [notification, setNotification] = useState({ message: "", type: "" });
  const [limit, setLimit] = useState(10);

  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [projectError, setProjectError] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [showBlockToast, setShowBlockToast] = useState(false);
  const [blockingSubtasks, setBlockingSubtasks] = useState([]);
  const [blockedDeveloperId, setBlockedDeveloperId] = useState(null);
  const [success, setSuccess] = useState("");

  const handleLogout = () => dispatch(logoutUser());

  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    
    setTimeout(() => {
      setNotification({ message: "", type: "" });
    }, 3000); // Hide after 3 seconds
  };

  const fetchProjects = async () => {
    try {
      const res = await apiClient.get("/api/projects/");
      setProjects(res.data.results || res.data);
    } catch (err) {
      setProjectError("Failed to fetch projects.");
    } finally {
      setLoadingProjects(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await apiClient.get("/api/employees/");
      const employeeList = Array.isArray(response.data)
        ? response.data
        : response.data.results || [];

      setEmployees(employeeList);
    } catch (err) {
      setError("Failed to load employees.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm("Are you sure you want to delete this employee?");
    if (!confirmed) return;
  
    try {
      await apiClient.delete(`/api/employees/${id}/`);
      setEmployees((prev) => prev.filter((emp) => emp.id !== id));
      showNotification("Employee deleted successfully.", "success");
    } catch (err) {
      showNotification("Failed to delete employee.", "error");
    }
  };

  const handleSave = async (formData, response) => {
    try {
      setFormError(""); // reset error before request
      if (editingEmployee) {
        const response = await apiClient.put(`/api/employees/${editingEmployee.id}/`, formData);
        setEmployees((prev) =>
          prev.map((emp) => (emp.id === editingEmployee.id ? response.data : emp))
        );
      } else {
        const response = await apiClient.post("/api/employees/", formData);
        setEmployees((prev) => [...prev, response.data]);
      }
      setShowModal(false);
      setRefreshAssignments(prev => !prev);
      setEditingEmployee(null);
      return response;
    } catch (err) {
      const msg =
        err?.response?.data?.non_field_errors?.[0] ||
        err?.response?.data?.detail ||
        Object.values(err?.response?.data || {}).flat()?.[0] ||
        "An unexpected error occurred.";
      setFormError(msg);
      throw err;
    }
  };
  
  const handleResendInvitation = async (id) => {
    const confirmed = window.confirm("Resend invitation to this employee?");
    if (!confirmed) return;

    try {
      await apiClient.post(`/api/employees/${id}/resend-invitation/`);
      showNotification("Invitation resent successfully.", "success");
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        Object.values(err?.response?.data || {})?.[0] ||
        "Failed to resend invitation.";
      showNotification(msg, "error");
    }
  };

  const fetchAuditLogs = async (customFilters = {}, reset = false, url = null) => {
    try {
      const merged = reset ? customFilters : { ...filters, ...customFilters };

      const cleanedFilters = Object.fromEntries(
        Object.entries(merged).filter(([_, v]) => v !== "" && v !== undefined && v !== null)
      );

      const fullUrl = url || `/api/audit-logs/?${new URLSearchParams({ limit, ...cleanedFilters })}`;

      const res = await apiClient.get(fullUrl);

      setAuditLogs(res.data.results || res.data);
      setNextPage(res.data.next || null);
      setPrevPage(res.data.previous || null);
      setFilters(cleanedFilters);
    } catch (err) {
      console.error("Failed to fetch audit logs", err);
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchAuditLogs();
    fetchProjects();
  }, [limit]);


  return (
    <div className="flex min-h-screen bg-[#F9FAFB] text-[#1A2A44]">
      {/* Sidebar */}
      <aside className="w-64 bg-[#1A2A44] text-white p-6 space-y-6">
        <h2 className="text-2xl font-bold">Admin Panel</h2>
        <nav className="space-y-4">
          <a href="#" className="block hover:text-[#00C4B4]">Dashboard</a>
          <a href="#" className="block hover:text-[#00C4B4]">Employees</a>
        </nav>
        <button
          onClick={handleLogout}
          className="mt-auto w-full bg-[#00C4B4] hover:bg-teal-600 text-white py-2 rounded transition"
        >
          Logout
        </button>
      </aside>

      {/* Main */}
      <main className="flex-1 p-10">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Tenant Admin Dashboard</h1>
          <p className="text-[#2F3A4C]">Manage your employees here.</p>
        </div>

        {notification.message && (
          <div
            className={`mb-4 p-4 rounded ${
              notification.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
            }`}
          >
            {notification.message}
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 rounded bg-green-100 text-green-800">
            {success}
          </div>
        )}


        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">All Employees</h2>
            <button
              onClick={() => {
                setEditingEmployee(null);
                setShowModal(true);
              }}
              className="bg-[#00C4B4] text-white px-4 py-2 rounded hover:bg-teal-600"
            >
              + Add Employee
            </button>
          </div>

          {loading ? (
            <p>Loading...</p>
          ) : error ? (
            <p className="text-red-600">{error}</p>
          ) : employees.length === 0 ? (
            <p>No employees found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white shadow rounded-lg border border-[#B0B8C5]">
                <thead className="bg-[#E5E8EC] text-[#2F3A4C]">
                  <tr>
                    <th className="py-3 px-4 text-left">Name</th>
                    <th className="py-3 px-4 text-left">Email</th>
                    <th className="py-3 px-4 text-left">Role</th>
                    <th className="py-3 px-4 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(employees) ? employees.map((emp) => (
                    <tr key={emp.id} className="border-t border-[#B0B8C5] hover:bg-[#F4F5F7]">
                      <td className="py-3 px-4">{emp.full_name}</td>
                      <td className="py-3 px-4">{emp.email}</td>
                      <td className="py-3 px-4 capitalize">{emp.role}</td>
                      <td className="py-3 px-4 space-x-2">
                        <button
                          onClick={() => {
                            setEditingEmployee(emp);
                            setShowModal(true);
                          }}
                          className="text-sm text-blue-600 hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(emp.id)}
                          className="text-sm text-red-600 hover:underline"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => handleResendInvitation(emp.id)}
                          className="text-sm text-yellow-600 hover:underline"
                        >
                          Resend Invite
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="4">No employee data available.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">All Projects</h2>
            {employees.filter(emp => emp.role === 'project_manager').length > 0 ? (
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-[#00C4B4] text-white px-4 py-2 rounded hover:bg-teal-600"
              >
                + Create Project
              </button>
            ) : (
              <button
                disabled
                className="bg-gray-300 text-gray-500 px-4 py-2 rounded cursor-not-allowed"
                title="You must have at least one Project Manager to create a project"
              >
                + Create Project
              </button>
            )}
        </div>
        {loadingProjects ? (
          <p>Loading projects...</p>
        ) : projectError ? (
          <p className="text-red-600">{projectError}</p>
        ) : projects.length === 0 ? (
          <p>No projects found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div
                key={project.id}
                onClick={() => navigate(`/tenant_admin/projects/${project.id}`)}
                className="bg-white p-4 rounded shadow border border-[#E5E8EC] hover:bg-[#F3F4F6] cursor-pointer transition"
              >
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-bold">{project.name}</h3>
                  <span className="text-sm px-2 py-1 rounded-full bg-blue-100 text-blue-600 capitalize">
                    {project.status || "planning"}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  {project.description?.slice(0, 100)}...
                </p>
                <p className="text-sm text-gray-500">
                  📅 {project.start_date} - {project.end_date || "N/A"}
                </p>
                <p className="text-sm mt-1">
                  🔥 Priority: <strong>{project.priority || "medium"}</strong>
                </p>
              </div>
            ))}
          </div>
        )}

        {showCreateModal && (
          <CreateProjectModal
            onClose={() => setShowCreateModal(false)}
            onSuccess={fetchProjects}
            currentUser={{ role: "tenant_admin" }} // or from auth
            allProjectManagers={employees.filter(emp => emp.role === 'project_manager')}
          />
        )}

        {showModal && (
          <EmployeeFormModal
            onClose={() => {
              setShowModal(false);
              setEditingEmployee(null);
              setFormError("");
            }}
            onSave={handleSave}
            onSuccess={fetchEmployees}
            initialData={editingEmployee}
            error={formError}
          />
        )}

        <PMDeveloperAssignmentManager
          onAssignmentChange={fetchAuditLogs}
          refreshTrigger={refreshAssignments}
          onBlocked={(subtasks, devId) => {
            setBlockingSubtasks(subtasks);
            setBlockedDeveloperId(devId);
            setShowBlockToast(true);
          }}
          onSuccessMessage={setSuccess}
        />

        <section className="mb-6">
          <h3 className="text-lg font-medium mb-2">Filter Logs</h3>
          <div className="flex flex-wrap gap-4">
            <select
              onChange={(e) => fetchAuditLogs({ developer: e.target.value || undefined })}
              className="border p-2 rounded"
              defaultValue=""
            >
              <option value="">All Developers</option>
              {Array.isArray(employees) ?  employees.map((emp) =>
                emp.role === "developer" ? (
                  <option key={emp.id} value={emp.id}>
                    {emp.full_name}
                  </option>
                ) : null
              ) : (
                <tr>
                  <td colSpan="4">No employee data available.</td>
                </tr>
              )}
            </select>

            <input
              type="date"
              className="border p-2 rounded"
              onChange={(e) => fetchAuditLogs({ from_date: e.target.value })}
            />

            <input
              type="date"
              className="border p-2 rounded"
              onChange={(e) => fetchAuditLogs({ to_date: e.target.value })}
            />
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold mb-4">Project Manager Assignment History</h2>
          {auditLogs.length === 0 ? (
            <p className="text-gray-600">No assignment activity yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white shadow rounded-lg border border-gray-200">
                <thead className="bg-gray-100 text-gray-700">
                  <tr>
                    <th className="py-2 px-4 text-left">Developer</th>
                    <th className="py-2 px-4 text-left">Previous PM</th>
                    <th className="py-2 px-4 text-left">New PM</th>
                    <th className="py-2 px-4 text-left">Assigned By</th>
                    <th className="py-2 px-4 text-left">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.slice(0, 10).map((log) => (
                    <tr key={log.id}>
                      <td className="py-2 px-4">{log.developer?.full_name}</td>
                      <td className="py-2 px-4">
                        {log.previous_manager ? log.previous_manager.full_name : "—"}
                      </td>
                      <td className="py-2 px-4">{log.new_manager?.full_name}</td>
                      <td className="py-2 px-4">{log.assigned_by?.full_name}</td>
                      <td className="py-2 px-4">
                        {log.assigned_at ? format(new Date(log.assigned_at), "dd MMM yyyy p") : "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex justify-end mt-4 space-x-2">
                {prevPage && (
                  <button
                    onClick={() => fetchAuditLogs({}, false, prevPage)}
                    className="text-blue-600 hover:underline"
                  >
                    ← Previous
                  </button>
                )}
                {nextPage && (
                  <button
                    onClick={() => fetchAuditLogs({}, false, nextPage)}
                    className="text-blue-600 hover:underline"
                  >
                    Next →
                  </button>
                )}
              </div>
            </div>
          )}
        </section>
      </main>
      {showBlockToast && (
        <SubtaskBlockToast
          developerId={blockedDeveloperId}
          blockingSubtasks={blockingSubtasks}
          onClose={() => setShowBlockToast(false)}
          onNotified={() => {
            setShowBlockToast(false);
            setSuccess("Project Manager has been notified.");
          }}
        />
      )}
    </div>
  );
};

export default TenantAdminDashboard;