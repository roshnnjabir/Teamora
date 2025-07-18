import { useState, useEffect } from "react";
import apiClient from "../../../../api/apiClient";

const priorities = ["low", "medium", "high"];

const EditTaskModal = ({ task, onClose, onUpdated }) => {
  const [labels, setLabels] = useState([]);
  const [selectedLabels, setSelectedLabels] = useState(task.labels?.map((l) => l.id) || []);
  const [formData, setFormData] = useState({
    title: task.title || "",
    description: task.description || "",
    priority: task.priority || "medium",
    due_date: task.due_date || "",
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchLabels = async () => {
      try {
        const res = await apiClient.get("/api/labels/");
        setLabels(res.data.results || []);
      } catch (err) {
        console.error("Failed to load labels", err);
      }
    };

    fetchLabels();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors((prev) => ({ ...prev, [e.target.name]: null }));
  };

  const toggleLabel = (id) => {
    setSelectedLabels((prev) =>
      prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      const payload = {
        ...formData,
        label_ids: selectedLabels,
        due_date: formData.due_date || null,
      };

      await apiClient.patch(`/api/tasks/${task.id}/`, payload);

      if (onUpdated) onUpdated();
      onClose();
    } catch (error) {
      const response = error?.response?.data;
      setErrors(response || { general: "Something went wrong." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg mx-4 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-red-500 text-xl"
        >
          ×
        </button>

        <h2 className="text-xl font-semibold text-[#2F3A4C] mb-4">Edit Task</h2>

        {errors.general && (
          <p className="mb-4 text-sm text-red-600">{errors.general}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Task Title</label>
            <input
              type="text"
              name="title"
              required
              value={formData.title}
              onChange={handleChange}
              className={`mt-1 w-full px-3 py-2 border-2 rounded-lg ${
                errors.title ? "border-red-500" : "border-gray-200"
              } focus:outline-none focus:ring-2 focus:ring-blue-400`}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className={`mt-1 w-full px-3 py-2 border-2 rounded-lg ${
                errors.description ? "border-red-500" : "border-gray-200"
              } focus:outline-none focus:ring-2 focus:ring-blue-400`}
            />
          </div>

          {/* Due Date & Priority */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700">Due Date</label>
              <input
                type="date"
                name="due_date"
                value={formData.due_date}
                onChange={handleChange}
                min={new Date().toISOString().split("T")[0]}
                className={`mt-1 w-full px-3 py-2 border-2 rounded-lg ${
                  errors.due_date ? "border-red-500" : "border-gray-200"
                } focus:outline-none focus:ring-2 focus:ring-blue-400`}
              />
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700">Priority</label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="mt-1 w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                {priorities.map((p) => (
                  <option key={p} value={p}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Labels */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Labels</label>
            <div className="flex flex-wrap gap-2">
              {labels.map((label) => (
                <button
                  key={label.id}
                  type="button"
                  onClick={() => toggleLabel(label.id)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition border-2 ${
                    selectedLabels.includes(label.id)
                      ? "text-white"
                      : "text-gray-700"
                  }`}
                  style={{
                    borderColor: label.color,
                    backgroundColor: selectedLabels.includes(label.id)
                      ? label.color
                      : "#fff",
                    color: selectedLabels.includes(label.id)
                      ? "#fff"
                      : label.color,
                  }}
                >
                  {label.name}
                </button>
              ))}
            </div>
          </div>

          {/* Errors */}
          {errors.non_field_errors && (
            <div className="mb-4 text-sm text-red-600">
              {errors.non_field_errors.map((err, idx) => (
                <p key={idx}>{err}</p>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#00C4B4] text-white rounded-lg hover:bg-[#009d94] disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditTaskModal;