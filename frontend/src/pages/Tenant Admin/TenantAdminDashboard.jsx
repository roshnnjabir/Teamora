import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { logoutUser } from "../../features/Auth/authThunks";
import { format } from "date-fns";
import apiClient from "../../contexts/apiClient";
import PMDeveloperAssignmentManager from "./PMDeveloperAssignmentManager";
import EmployeeFormModal from "./EmployeeFormModal";

const TenantAdminDashboard = () => {
  const dispatch = useDispatch();
  const [refreshAssignments, setRefreshAssignments] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [formError, setFormError] = useState("");
  const [notification, setNotification] = useState({ message: "", type: "" });
  const [limit, setLimit] = useState(10);

  const handleLogout = () => dispatch(logoutUser());

  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    
    setTimeout(() => {
      setNotification({ message: "", type: "" });
    }, 3000); // Hide after 3 seconds
  };


  const fetchEmployees = async () => {
    try {
      const response = await apiClient.get("/api/employees/");
      setEmployees(response.data);
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

  const fetchAuditLogs = async () => {
    try {
      const res = await apiClient.get(`/api/audit-logs/?limit=${limit}`);
      setAuditLogs(res.data.results || res.data);
    } catch (err) {
      console.error("Failed to fetch audit logs", err);
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchAuditLogs();
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
                  {employees.map((emp) => (
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
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

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


        <PMDeveloperAssignmentManager onAssignmentChange={fetchAuditLogs} refreshTrigger={refreshAssignments}/>
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
              {auditLogs.length >= limit && (
                <button
                  onClick={() => setLimit((prev) => prev + 10)}
                  className="mt-4 text-blue-600 hover:underline"
                >
                  Show More
                </button>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default TenantAdminDashboard;
