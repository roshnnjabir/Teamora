import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { logoutUser } from "../../auth/features/authThunks";
import apiClient from "../../../api/apiClient";

const SuperAdminDashboard = () => {
  const dispatch = useDispatch();
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [auditLogs, setAuditLogs] = useState([]);
  const [selectedTenantId, setSelectedTenantId] = useState(null);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const handleLogout = () => dispatch(logoutUser());

  const fetchTenants = async () => {
    try {
      const response = await apiClient.get("/api/super-admin-dashboard/");
      setTenants(response.data);
    } catch (err) {
      setError("Failed to load tenants.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleBlockStatus = async (tenantId) => {
    try {
      const response = await apiClient.post(`/api/toggle-block/${tenantId}/`);
      setTenants((prev) =>
        prev.map((tenant) =>
          tenant.id === tenantId ? { ...tenant, is_blocked: response.data.is_blocked } : tenant
        )
      );
    } catch (err) {
      console.error("Failed to toggle block status", err);
      alert("Error updating block status.");
    }
  };

  const fetchAuditLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await apiClient.get("/api/billing/audit-log/");
      setAuditLogs(res.data.results || []);
    } catch (err) {
      console.error("Failed to fetch audit logs", err);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchTenants();
    fetchAuditLogs();
  }, []);

  const openAuditLog = (tenantId) => {
    setSelectedTenantId(tenantId);
  };

  const closeAuditLog = () => {
    setSelectedTenantId(null);
  };

  const filteredLogs = auditLogs.filter((log) => log.tenant_id === selectedTenantId);

  return (
    <div className="flex min-h-screen bg-[#F9FAFB] text-[#1A2A44]">
      <aside className="w-64 bg-[#1A2A44] text-white p-6 space-y-6">
        <h2 className="text-2xl font-bold">Super Admin</h2>
        <nav className="space-y-4">
          <a href="#" className="block hover:text-[#00C4B4]">Dashboard</a>
        </nav>
        <button
          onClick={handleLogout}
          className="mt-auto w-full bg-[#00C4B4] hover:bg-teal-600 text-white py-2 rounded transition"
        >
          Logout
        </button>
      </aside>

      <main className="flex-1 p-10">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Tenant Overview</h1>
          <p className="text-[#2F3A4C]">Manage all tenants and view payment logs.</p>
        </div>

        <section>
          {loading ? (
            <p>Loading tenants...</p>
          ) : error ? (
            <p className="text-red-600">{error}</p>
          ) : tenants.length === 0 ? (
            <p>No tenants found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white shadow rounded-lg border border-[#B0B8C5]">
                <thead className="bg-[#E5E8EC] text-[#2F3A4C]">
                  <tr>
                    <th className="py-3 px-4 text-left">Name</th>
                    <th className="py-3 px-4 text-left">Schema</th>
                    <th className="py-3 px-4 text-left">Subdomain</th>
                    <th className="py-3 px-4 text-left">Trial</th>
                    <th className="py-3 px-4 text-left">Paid Until</th>
                    <th className="py-3 px-4 text-left">Blocked</th>
                    <th className="py-3 px-4 text-left">Users</th>
                    <th className="py-3 px-4 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tenants.map((tenant) => (
                    <tr key={tenant.id} className="border-t border-[#B0B8C5] hover:bg-[#F4F5F7]">
                      <td className="py-3 px-4 font-medium">{tenant.name}</td>
                      <td className="py-3 px-4">{tenant.schema}</td>
                      <td className="py-3 px-4">{tenant.subdomain}</td>
                      <td className="py-3 px-4">{tenant.on_trial ? "Yes" : "No"}</td>
                      <td className="py-3 px-4">{tenant.paid_until || "—"}</td>
                      <td className="py-3 px-4">{tenant.is_blocked ? "Yes" : "No"}</td>
                      <td className="py-3 px-4">{tenant.user_count}</td>
                      <td className="py-3 px-4 flex space-x-2">
                        <button
                          onClick={() => toggleBlockStatus(tenant.id)}
                          className={`px-3 py-1 text-sm rounded ${
                            tenant.is_blocked
                              ? "bg-green-600 text-white hover:bg-green-700"
                              : "bg-red-600 text-white hover:bg-red-700"
                          }`}
                        >
                          {tenant.is_blocked ? "Unblock" : "Block"}
                        </button>
                        <button
                          onClick={() => openAuditLog(tenant.id)}
                          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          View Payments
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {selectedTenantId && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-start pt-20 z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full">
              <h2 className="text-xl font-semibold mb-4">Payment History</h2>
              {loadingLogs ? (
                <p>Loading...</p>
              ) : filteredLogs.length === 0 ? (
                <p>No payment records found for this tenant.</p>
              ) : (
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left border-b">
                      <th className="py-2 px-3">Date</th>
                      <th className="py-2 px-3">Amount</th>
                      <th className="py-2 px-3">Status</th>
                      <th className="py-2 px-3">Paid Until</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map((log) => (
                      <tr key={log.stripe_session_id} className="border-t">
                        <td className="py-2 px-3">
                          {new Date(log.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-2 px-3">
                          ${parseFloat(log.amount).toFixed(2)} {log.currency.toUpperCase()}
                        </td>
                        <td className="py-2 px-3 capitalize">{log.payment_status}</td>
                        <td className="py-2 px-3">{log.paid_until}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <button
                onClick={closeAuditLog}
                className="mt-4 bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default SuperAdminDashboard;