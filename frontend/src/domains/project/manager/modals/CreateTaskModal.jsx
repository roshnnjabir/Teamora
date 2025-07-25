import { useState, useEffect } from "react";
import apiClient from "../../../../api/apiClient";
import ConfirmToast from "../../../../components/Modals/ConfirmToast";

const priorities = ["low", "medium", "high"];
const status = ["todo", "in_progress", "done"];

const CreateTaskModal = ({ projectId, onClose, onTaskCreated }) => {
  const [labels, setLabels] = useState([]);
  const [selectedLabels, setSelectedLabels] = useState([]);
  const [showConfirmToast, setShowConfirmToast] = useState(false);
  const [skipDateCheck, setSkipDateCheck] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium",
    due_date: "",
    status: "todo",
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

    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required.";
    }

    if (!formData.description.trim() || formData.description.trim().length < 10) {
      newErrors.description = "Description is required and should be at least 10 characters.";
    }

    if (formData.due_date) {
      const selectedDate = new Date(formData.due_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        newErrors.due_date = ["Due date cannot be in the past."];
      }
    }

    if (!formData.due_date && !skipDateCheck) {
      setShowConfirmToast(true);
      setIsSubmitting(false);
      return;
    }


    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsSubmitting(false);
      return;
    }

    // Client-side validation for missing projectId
    if (!projectId) {
      setErrors({ general: "Project ID is missing." });
      setIsSubmitting(false);
      return;
    }

    try {
      const payload = {
        ...formData,
        project: projectId,
        assigned_to: null,
        due_date: formData.due_date || null,
        label_ids: selectedLabels,
      };

      const res = await apiClient.post("/api/tasks/", payload);

      if (onTaskCreated) {
        onTaskCreated(res.data); // not .results
      }

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

        <h2 className="text-xl font-semibold text-[#2F3A4C] mb-4">Create New Task</h2>

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
              value={formData.title}
              onChange={handleChange}
              className={`mt-1 w-full px-3 py-2 border-2 rounded-lg ${
                errors.title ? "border-red-500" : "border-gray-200"
              } focus:outline-none focus:ring-2 focus:ring-blue-400`}
            />
            {errors.title && (
              <p className="text-red-500 text-sm mt-1">
                {Array.isArray(errors.title) ? errors.title[0] : errors.title}
              </p>
            )}
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
              <p className="text-red-500 text-sm mt-1">{errors.description}</p>
            )}
          </div>

          {/* Due Date & Priority */}
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[140px]">
              <label className="block text-sm font-medium text-gray-700">Due Date</label>
              <input
                type="date"
                name="due_date"
                value={formData.due_date}
                onChange={handleChange}
                // min={new Date().toISOString().split("T")[0]}
                className={`mt-1 w-full px-3 py-2 border-2 rounded-lg ${
                  errors.due_date ? "border-red-500" : "border-gray-200"
                } focus:outline-none focus:ring-2 focus:ring-blue-400`}
              />
              {errors.due_date && (
                <p className="text-red-500 text-sm mt-1">{errors.due_date[0]}</p>
              )}
            </div>

            <div className="flex-1 min-w-[140px]">
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

            <div className="flex-1 min-w-[140px]">
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="mt-1 w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                {status.map((p) => (
                  <option key={p} value={p}>
                    {p
                      .split("_")
                      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                      .join(" ")}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Labels */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Labels</label>
            {labels.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No labels available.</p>
            ) : (
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
            )}
          </div>

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
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>


      {showConfirmToast && (
        <ConfirmToast
          message="No due date set. Do you want to continue without setting a due date?"
          onConfirm={() => {
            setSkipDateCheck(true);
            setShowConfirmToast(false);
            handleSubmit(new Event("submit"));
          }}
          onCancel={() => {
            setShowConfirmToast(false);
          }}
        />
      )}
    </div>
  );
};

export default CreateTaskModal;