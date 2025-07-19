import { useEffect, useState } from "react";
import apiClient from "../../../api/apiClient";

const UserListModal = ({ onClose, onStartChat }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await apiClient.get("/api/users");
        setUsers(res.data || []);
      } catch (err) {
        console.error("Failed to load users", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4 max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-[#2F3A4C]">Start Private Chat</h2>
          <button
            onClick={onClose}
            className="text-2xl text-gray-500 hover:text-red-500 font-bold"
            title="Close"
          >
            &times;
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <p className="text-gray-500">Loading users...</p>
        ) : users.length === 0 ? (
          <p className="text-gray-500">No users found.</p>
        ) : (
          <div className="space-y-2">
            {users.map((user) => (
              <div
                key={user.id}
                onClick={() => onStartChat(user.id)}
                className="p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition"
              >
                <div className="font-medium text-[#1A2A44]">{user.full_name || user.name || user.email}</div>
                <div className="text-sm text-gray-500">{user.email}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserListModal;