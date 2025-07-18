import { useState, useEffect } from "react";

const SubtaskModal = ({ show, onClose, tasks = [], developers = [], onSubmit }) => {
  const [form, setForm] = useState({
    title: "",
    description: "",
    taskId: null,
    assignedToId: "",
    status: "todo",
    due_date: "",
    priority: "medium",
    estimated_hours: ""
  });

  useEffect(() => {
    if (tasks.length > 0 && form.taskId === null) {
      setForm(prev => ({ ...prev, taskId: tasks[0].id }));
    }
  }, [tasks, form.taskId]);

  useEffect(() => {
    if (show) {
      setForm({
        title: "",
        description: "",
        taskId: tasks.length > 0 ? tasks[0].id : null,
        assignedToId: "",
        status: "todo",
        due_date: "",
        priority: "medium",
        estimated_hours: ""
      });
    }
  }, [show, tasks]);


  const handleChange = (e) => {
    const { name, value } = e.target;
    const parsedValue = ["taskId", "assignedToId", "estimated_hours"].includes(name)
      ? value === "" ? null : Number(value)
      : value;

    setForm(prev => ({ ...prev, [name]: parsedValue }));
  };

  const handleSubmit = () => {
    if (!form.title || !form.taskId || !form.status) return;

    const payload = {
      title: form.title,
      description: form.description || "",
      taskId: form.taskId,
      assigned_to: form.assignedToId || null,
      status: form.status,
      due_date: form.due_date || null,
      priority: form.priority,
      estimated_hours: form.estimated_hours || null
    };

    console.log(payload);

    onSubmit(payload);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/10 px-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 space-y-4">
        <h2 className="text-lg font-semibold">Create New Subtask</h2>

        <input
          type="text"
          name="title"
          value={form.title}
          onChange={handleChange}
          placeholder="Subtask Title *"
          className="w-full border p-2 rounded"
        />

        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Subtask Description"
          className="w-full border p-2 rounded"
        />

        <select
          name="taskId"
          value={form.taskId || ""}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        >
          {tasks.map(task => (
            <option key={task.id} value={task.id}>
              {task.title}
            </option>
          ))}
        </select>

        <select
          name="assignedToId"
          value={form.assignedToId || ""}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        >
          <option value="">Unassigned</option>
          {developers.map(dev => (
            <option key={dev.id} value={dev.id}>
              {dev.full_name || dev.username}
            </option>
          ))}
        </select>

        <div className="grid grid-cols-2 gap-4">
          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          >
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>

          <select
            name="priority"
            value={form.priority}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <input
            type="date"
            name="due_date"
            value={form.due_date}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />

          <input
            type="number"
            name="estimated_hours"
            value={form.estimated_hours || ""}
            onChange={handleChange}
            placeholder="Est. Hours"
            className="w-full border p-2 rounded"
            min="0"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-[#00C4B4] hover:bg-teal-600 text-white rounded"
            disabled={!form.title || !form.taskId}
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubtaskModal;