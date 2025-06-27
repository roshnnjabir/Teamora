import { useState } from "react";
import apiClient from "../../contexts/apiClient";

const CreateProjectModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    start_date: "",
    end_date: "",
    priority: "medium",
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = ["Project name is required."];
    }

    if (formData.description && formData.description.trim().length < 10) {
      newErrors.description = ["Description must be at least 10 characters."];
    }

    const today = new Date().toISOString().split("T")[0];

    if (formData.start_date && formData.start_date < today) {
      newErrors.start_date = ["Start date cannot be in the past."];
    }

    if (formData.start_date && formData.end_date && formData.end_date < formData.start_date) {
      newErrors.end_date = ["End date cannot be before start date."];
    }

    return newErrors;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: null });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      await apiClient.post("/api/projects/", formData);
      if (onSuccess) onSuccess();
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
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg mx-4">
        <h2 className="text-xl font-semibold text-[#2F3A4C] mb-4">Create New Project</h2>

        {errors.general && (
          <p className="mb-4 text-sm text-red-600">{errors.general}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Project Name</label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className={`mt-1 w-full px-3 py-2 border-2 rounded-lg ${
                errors.name ? "border-red-500" : "border-gray-200"
              } focus:outline-none focus:ring-2 focus:ring-blue-400`}
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name[0]}</p>}
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

          {/* Dates */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700">Start Date</label>
              <input
                type="date"
                name="start_date"
                value={formData.start_date}
                onChange={handleChange}
                className={`mt-1 w-full px-3 py-2 border-2 rounded-lg ${
                  errors.start_date ? "border-red-500" : "border-gray-200"
                } focus:outline-none focus:ring-2 focus:ring-blue-400`}
              />
              {errors.start_date && (
                <p className="text-red-500 text-sm mt-1">{errors.start_date[0]}</p>
              )}
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700">End Date</label>
              <input
                type="date"
                name="end_date"
                value={formData.end_date}
                onChange={handleChange}
                className={`mt-1 w-full px-3 py-2 border-2 rounded-lg ${
                  errors.end_date ? "border-red-500" : "border-gray-200"
                } focus:outline-none focus:ring-2 focus:ring-blue-400`}
              />
              {errors.end_date && (
                <p className="text-red-500 text-sm mt-1">{errors.end_date[0]}</p>
              )}
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Priority</label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="mt-1 w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            {errors.priority && (
              <p className="text-red-500 text-sm mt-1">{errors.priority[0]}</p>
            )}
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
              className="px-4 py-2 bg-[#00C4B4] text-white rounded-lg hover:bg-teal-600 disabled:opacity-50"
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

export default CreateProjectModal;
