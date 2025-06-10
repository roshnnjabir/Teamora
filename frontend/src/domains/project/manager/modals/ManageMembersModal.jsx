import { useState, useEffect } from "react";
import apiClient from "../../contexts/apiClient";

const ManageMembersModal = ({ projectId, developers = [], currentMembers = [], onClose, onSuccess }) => {
  const [selectedDevIds, setSelectedDevIds] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Filter out already assigned developers
  const availableDevelopers = developers.filter(
    (dev) => !currentMembers.some((member) => member.employee.id === dev.id)
  );
  

  const handleCheckboxChange = (id) => {
    setSelectedDevIds((prev) =>
      prev.includes(id) ? prev.filter((devId) => devId !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    if (selectedDevIds.length === 0) {
      setError("Please select at least one developer.");
      return;
    }

    setLoading(true);
    try {
      await apiClient.post("/api/members/bulk-assign/", {
        project: projectId,
        developers: selectedDevIds,
      });

      onSuccess?.();
    } catch (err) {
      setError("Failed to assign members.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
      <div className="bg-white p-6 rounded-xl w-full max-w-lg">
        <h2 className="text-xl font-bold mb-4">Add Members</h2>

        {error && <p className="text-red-600 text-sm mb-2">{error}</p>}

        <div className="max-h-64 overflow-y-auto mb-4 border p-2 rounded">
          {availableDevelopers.length === 0 ? (
            <p className="text-sm text-gray-500">All developers are already assigned.</p>
          ) : (
            availableDevelopers.map((dev) => (
              <label key={dev.id} className="flex items-center gap-2 py-1">
                <input
                  type="checkbox"
                  value={dev.id}
                  checked={selectedDevIds.includes(dev.id)}
                  onChange={() => handleCheckboxChange(dev.id)}
                />
                <span>{dev.full_name} ({dev.email})</span>
              </label>
            ))
          )}
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            disabled={loading}
          >
            {loading ? "Adding..." : "Add Selected"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManageMembersModal;