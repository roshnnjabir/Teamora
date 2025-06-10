import { useState, useEffect } from "react";
import apiClient from "../../contexts/apiClient";
import { PRIORITIES, TASK_STATUSES } from "../../utils/constants";


const CreateSubtaskModal = ({ taskId, projectId, onClose, onCreated }) => {
  const [developers, setDevelopers] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    due_date: "",
    status: "todo",
    priority: "medium",
    assigned_to: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchDevelopers = async () => {
      try {
        const res = await apiClient.get(`/api/my-developers/?project_id=${projectId}`);
        setDevelopers(res.data);
      } catch (err) {
        console.error("Failed to load developers", err);
      }
    };

    fetchDevelopers();
  }, [projectId]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: null });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      const payload = {
        ...formData,
        task: taskId,
        due_date: formData.due_date || null,
      };

      await apiClient.post("/api/subtasks/", payload);
      onCreated?.();
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
        {/* Close Icon */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-red-500 text-xl"
        >
          ×
        </button>

        <h2 className="text-xl font-semibold text-[#2F3A4C] mb-4">Create Subtask</h2>

        {errors.general && (
          <p className="mb-4 text-sm text-red-600">{errors.general}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Title</label>
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
            {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title[0]}</p>}
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
            {errors.description && (
              <p className="text-red-500 text-sm mt-1">{errors.description[0]}</p>
            )}
          </div>

          {/* Due Date, Status, Priority */}
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
              {errors.due_date && (
                <p className="text-red-500 text-sm mt-1">{errors.due_date[0]}</p>
              )}
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700">Priority</label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="mt-1 w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Status & Assigned To */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="mt-1 w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                {TASK_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.replace("_", " ").toUpperCase()}
                  </option>
                ))}
              </select>
              {errors.status && (
                <p className="text-red-500 text-sm mt-1">{errors.status[0]}</p>
              )}
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700">Assign to</label>
              <select
                name="assigned_to"
                value={formData.assigned_to}
                onChange={handleChange}
                className="mt-1 w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="">-- Select Developer --</option>
                {developers.map((dev) => (
                  <option key={dev.id} value={dev.id}>
                    {dev.full_name || dev.email}
                  </option>
                ))}
              </select>
              {errors.assigned_to && (
                <p className="text-red-500 text-sm mt-1">{errors.assigned_to[0]}</p>
              )}
            </div>
          </div>

          {/* Buttons */}
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
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateSubtaskModal;