import { STATUS_COLORS, PRIORITY_COLORS } from './constants';

export const getStatusColor = (status) =>
  STATUS_COLORS[status] || 'bg-gray-100 text-gray-800';;

export const getPriorityColor = (priority) =>
  PRIORITY_COLORS[priority] || 'text-gray-600';

export const getInitials = (name) =>
  name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';

export const generateColumns = (tasks, developers) => {
  const columns = {};

  columns[0] = {
    id: 0,
    title: "Unassigned",
    items: [],
  };

  developers.forEach((dev) => {
    columns[dev.id] = {
      id: dev.id,
      title: `${dev.full_name} (${dev.assigned_subtasks_count || 0})`,
      items: [],
    };
  });

  tasks.forEach((task) => {
    const assignedTo = task.assigned_to || 0;
    if (!columns[assignedTo]) {
      columns[assignedTo] = {
        id: assignedTo,
        title: "Unassigned",
        items: [],
      };
    }
    columns[assignedTo].items.push(task);
  });

  return columns;
};

export const getStatusBadge = (status) => {
  const colorMap = {
    todo: "bg-gray-200 text-gray-700",
    in_progress: "bg-yellow-100 text-yellow-700",
    done: "bg-green-100 text-green-700",
  };

  const labelMap = {
    todo: "To Do",
    in_progress: "In Progress",
    done: "Done",
  };

  return (
    <span className={`text-xs px-2 py-1 rounded-full ${colorMap[status] || "bg-gray-100 text-gray-600"}`}>
      {labelMap[status] || status}
    </span>
  );
};

export const getPriorityLabel = (priority) => {
  const map = {
    high: "🔥 High",
    medium: "🟡 Medium",
    low: "🟢 Low",
  };
  return map[priority?.toLowerCase()] || "Unknown";
};
