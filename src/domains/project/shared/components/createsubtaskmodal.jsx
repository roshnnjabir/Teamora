import { useState, useEffect } from "react";
import apiClient from "../../../../api/apiClient";
import { PRIORITIES, TASK_STATUSES } from "../../../../utils/constants";

const CreateSubtaskModal = ({ taskId, projectId, onClose, onCreated }) => {
  const [developers, setDevelopers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    due_date: "",
    status: "todo",
    priority: "medium",
    assigned_to: "",
    estimated_hours: "",
    task: taskId || "",
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingTasks(true);
        const [devRes, taskRes] = await Promise.all([
          apiClient.get(`/api/my-developers/?project_id=${projectId}`),
          !taskId ? apiClient.get(`/api/projects/${projectId}/tasks/`) : Promise.resolve({ data: [] })
        ]);

        setDevelopers(devRes.data);
        if (!taskId) setTasks(taskRes.data);
      } catch (err) {
        console.error("Failed to fetch data", err);
      } finally {
        setLoadingTasks(false);
      }
    };

    fetchData();
  }, [projectId, taskId]);

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      title: "",
      description: "",
      due_date: "",
      status: "todo",
      priority: "medium",
      assigned_to: "",
      estimated_hours: "",
      task: taskId || ""
    }));
    setErrors({});
  }, [taskId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const parsedValue =
      name === "estimated_hours"
        ? value === "" ? "" : parseFloat(value)
        : value;

    setFormData({ ...formData, [name]: parsedValue });
    setErrors({ ...errors, [name]: null });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      const payload = {
        title: formData.title,
        description: formData.description || "",
        due_date: formData.due_date || null,
        status: formData.status,
        priority: formData.priority,
        task: formData.task,
        assigned_to_id: formData.assigned_to || null,
        estimated_hours: formData.estimated_hours || null,
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

  const isTaskMissing = !taskId && tasks.length === 0 && !loadingTasks;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg mx-4 relative">
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
          {/* Task Selector or message */}
          {!taskId && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Task</label>
              {loadingTasks ? (
                <p className="text-sm text-gray-500">Loading tasks...</p>
              ) : tasks.length === 0 ? (
                <p className="text-sm text-red-500">
                  No tasks found. Please add a task first to create a subtask.
                </p>
              ) : (
                <select
                  name="task"
                  value={formData.task}
                  onChange={handleChange}
                  required
                  className="mt-1 w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="">-- Select Task --</option>
                  {tasks.map((task) => (
                    <option key={task.id} value={task.id}>
                      {task.title}
                    </option>
                  ))}
                </select>
              )}
              {errors.task && <p className="text-red-500 text-sm mt-1">{errors.task[0]}</p>}
            </div>
          )}

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

          {/* Due Date + Priority + Estimated Hours */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Due Date</label>
              <input
                type="date"
                name="due_date"
                value={formData.due_date}
                onChange={handleChange}
                className={`mt-1 w-full px-3 py-2 border-2 rounded-lg ${
                  errors.due_date ? "border-red-500" : "border-gray-200"
                } focus:outline-none focus:ring-2 focus:ring-blue-400`}
              />
              {errors.due_date && (
                <p className="text-red-500 text-sm mt-1">{errors.due_date[0]}</p>
              )}
            </div>

            <div>
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

            <div>
              <label className="block text-sm font-medium text-gray-700">Est. Hours</label>
              <input
                type="number"
                name="estimated_hours"
                value={formData.estimated_hours}
                onChange={handleChange}
                min="0"
                step="0.1"
                className="mt-1 w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="e.g. 4.5"
              />
              {errors.estimated_hours && (
                <p className="text-red-500 text-sm mt-1">{errors.estimated_hours[0]}</p>
              )}
            </div>
          </div>

          {/* Status & Assignee */}
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
              disabled={isSubmitting || isTaskMissing}
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