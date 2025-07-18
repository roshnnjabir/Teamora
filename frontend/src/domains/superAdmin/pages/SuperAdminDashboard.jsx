import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { logoutUser } from "../../auth/features/authThunks";
import apiClient from "../../../api/apiClient";

const SuperAdminDashboard = () => {
  const dispatch = useDispatch();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [formError, setFormError] = useState("");

  const handleLogout = () => dispatch(logoutUser());

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
    if (!window.confirm("Are you sure you want to delete this employee?")) return;

    try {
      await apiClient.delete(`/api/employees/${id}/`);
      setEmployees((prev) => prev.filter((emp) => emp.id !== id));
    } catch (err) {
      alert("Failed to delete employee.");
    }
  };

  const handleSave = async (formData) => {
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
      setEditingEmployee(null);
    } catch (err) {
      const msg =
        err?.response?.data?.non_field_errors?.[0] ||
        err?.response?.data?.detail ||
        Object.values(err?.response?.data || {}).flat()?.[0] ||
        "An unexpected error occurred.";
      setFormError(msg);
    }
  };


  useEffect(() => {
    fetchEmployees();
  }, []);

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
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default SuperAdminDashboard;
