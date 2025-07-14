import { useState } from "react";
import apiClient from "../../../../api/apiClient";

const statusOptions = [
  { value: "todo", label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "done", label: "Done" },
];

const StatusUpdateModal = ({ task, onClose, onSave }) => {
  const [newStatus, setNewStatus] = useState(task.status || "todo");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError("");

    if (!newStatus) {
      setError("Please select a status.");
      return;
    }

    setIsSubmitting(true);

    try {
      await apiClient.patch(`/api/subtasks/${task.id}/`, { status: newStatus });
      onSave(newStatus); // Notify parent
    } catch (err) {
      const data = err.response?.data;
      if (data?.status) {
        setError(data.status.join(" "));
      } else if (data?.detail) {
        setError(data.detail);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/40">
      <div className="bg-white p-6 rounded-lg w-96 shadow-xl">
        <h2 className="text-xl font-semibold mb-4 text-[#1A2A44]">Update Task Status</h2>

        {/* Task Title (Read Only) */}
        <div className="mb-4">
          <label className="block text-sm text-[#2F3A4C] mb-1">Task Title</label>
          <input
            type="text"
            value={task.title}
            disabled
            className="w-full p-2 bg-[#E5E8EC] border border-[#B0B8C5] rounded text-[#2F3A4C]"
          />
        </div>

        {/* Status Dropdown */}
        <div className="mb-4">
          <label className="block text-sm text-[#2F3A4C] mb-1">Status</label>
          <select
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
            className="w-full p-2 border border-[#B0B8C5] rounded text-[#2F3A4C]"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-[#EF4444] text-white text-sm px-3 py-2 mb-3 rounded">
            {error}
          </div>
        )}

        {/* Buttons */}
        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-[#B0B8C5] border border-[#B0B8C5] rounded hover:bg-[#E5E8EC]"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`px-4 py-2 text-white rounded ${
              isSubmitting
                ? "bg-[#9CA3AF] cursor-not-allowed"
                : "bg-[#00C4B4] hover:bg-teal-600"
            }`}
          >
            {isSubmitting ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StatusUpdateModal;