// components/ProjectDetail/EditTaskLabelsModal.jsx

import { useEffect, useState } from "react";
import apiClient from "../../contexts/apiClient";

const EditTaskLabelsModal = ({ task, onClose }) => {
  const [allLabels, setAllLabels] = useState([]);
  const [selectedIds, setSelectedIds] = useState(task.labels?.map(l => l.id) || []);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchLabels = async () => {
      try {
        const res = await apiClient.get("/api/labels/");
        setAllLabels(res.data);
      } catch (err) {
        console.error("Failed to load labels", err);
      }
    };

    fetchLabels();
  }, []);

  const handleToggle = (labelId) => {
    setSelectedIds((prev) =>
      prev.includes(labelId)
        ? prev.filter((id) => id !== labelId)
        : [...prev, labelId]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiClient.patch(`/api/tasks/${task.id}/`, {
        label_ids: selectedIds,
      });
      onClose();
    } catch (err) {
      console.error("Error updating labels", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg w-full max-w-sm p-6 shadow-lg relative">
        <h2 className="text-lg font-semibold text-[#1A2A44] mb-4">🏷️ Edit Labels</h2>

        <div className="grid grid-cols-2 gap-2 mb-4">
          {allLabels.map((label) => (
            <label
              key={label.id}
              className={`text-sm font-medium px-2 py-1 rounded-full cursor-pointer border ${
                selectedIds.includes(label.id)
                  ? "border-[#00C4B4] bg-[#E0F7F5]"
                  : "border-gray-300"
              }`}
              style={{ backgroundColor: selectedIds.includes(label.id) ? label.color : "#fff", color: selectedIds.includes(label.id) ? "#fff" : "#1A2A44" }}
              onClick={() => handleToggle(label.id)}
            >
              {label.name}
            </label>
          ))}
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="text-sm text-gray-500 hover:underline"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-[#00C4B4] text-white text-sm px-4 py-1.5 rounded hover:bg-teal-600"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditTaskLabelsModal;
