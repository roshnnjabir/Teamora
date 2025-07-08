import { STATUS_COLORS, PRIORITY_COLORS } from './constants';

export const getStatusColor = (status) =>
  STATUS_COLORS[status] || 'bg-gray-100 text-gray-800';;

export const getPriorityColor = (priority) =>
  PRIORITY_COLORS[priority] || 'text-gray-600';

export const getInitials = (name) =>
  name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';

export const generateColumns = (tasksList = [], devList = []) => {
  if (!Array.isArray(tasksList)) {
    console.error("generateColumns error: tasksList is not an array:", tasksList);
    tasksList = [];
  }

  if (!Array.isArray(devList)) {
    console.error("generateColumns error: devList is not an array:", devList);
    devList = [];
  }

  const grouped = {
    0: {
      id: 0,
      title: "Unassigned",
      tasks: tasksList.filter(t => !t.assigned_to),
    },
  };

  devList.forEach((dev) => {
    grouped[dev.id] = {
      id: dev.id,
      title: dev.full_name,
      subtitle: dev.email,
      isFormer: false,
      tasks: tasksList.filter(t => t.assigned_to === dev.id),
    };
  });

  return grouped;
};