import { useState, useMemo } from "react";
import { getStatusBadge, getPriorityLabel } from "../../../../utils/projectUtils";
import CreateTaskModal from "../../manager/modals/CreateTaskModal";

// Task Card Component for better organization
const TaskCard = ({ task, isExpanded, onToggle }) => {
  const hasSubtasks = task.subtasks?.length > 0;
  
  return (
    <li className="group p-4 border border-[#E5E8EC] rounded-lg bg-[#F9FAFB] hover:shadow-md transition-shadow duration-200">
      {/* Task Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <a
            href={`/project_manager/tasks/${task.id}`}
            className="text-[#00C4B4] font-semibold hover:underline text-lg block mb-1 group-hover:text-teal-600 transition-colors"
          >
            {task.title}
          </a>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              Priority: {getPriorityLabel(task.priority)}
            </span>
            {task.due_date && (
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                Due: {new Date(task.due_date).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasSubtasks && (
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
              {task.subtasks.length} subtasks
            </span>
          )}
          {getStatusBadge(task.status)}
        </div>
      </div>

      {/* Task Description */}
      {task.description && (
        <p className="text-sm text-gray-700 mb-3 line-clamp-2">
          {task.description}
        </p>
      )}

      {/* Toggle Subtasks Button */}
      {hasSubtasks && (
        <button
          onClick={() => onToggle(task.id)}
          className="flex items-center gap-2 text-sm text-[#00C4B4] font-medium hover:underline hover:text-teal-600 transition-colors"
        >
          <svg 
            className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          {isExpanded ? "Hide Subtasks" : "Show Subtasks"}
        </button>
      )}

      {/* Subtasks (Expandable) */}
      {isExpanded && hasSubtasks && (
        <div className="mt-4 border-t pt-4 animate-fadeIn">
          <div className="space-y-3">
            {task.subtasks.map((subtask) => (
              <SubtaskCard key={subtask.id} subtask={subtask} task={task} />
            ))}
          </div>
        </div>
      )}
    </li>
  );
};

// Subtask Card Component
const SubtaskCard = ({ subtask, task }) => (
  <div className="pl-4 border-l-4 border-[#00C4B4] bg-white p-3 rounded-md shadow-sm hover:shadow-md transition-shadow duration-200">
    <div className="flex justify-between items-start mb-2">
      <a
        href={`/project_manager/tasks/${task?.id}/subtasks/${subtask.id}`}
        className="text-[#00C4B4] font-medium hover:underline hover:text-teal-600 transition-colors"
      >
        {subtask.title}
      </a>
      <span className="text-xs text-gray-500">
        ID: {subtask.id}
      </span>
    </div>
    
    {subtask.description && (
      <p className="text-xs text-gray-600 mb-2">
        {subtask.description.length > 100 
          ? `${subtask.description.slice(0, 100)}...` 
          : subtask.description
        }
      </p>
    )}
    
    <div className="flex items-center justify-between text-xs">
      <span className="text-gray-500">
        Assigned to:{" "}
        {subtask.assigned_to ? (
          <span className="font-medium text-gray-700">{subtask.assigned_to.full_name}</span>
        ) : (
          <span className="italic text-gray-400">Unassigned</span>
        )}
      </span>
      {subtask.status && (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          subtask.status === 'completed' 
            ? 'bg-green-100 text-green-800' 
            : subtask.status === 'in_progress'
            ? 'bg-blue-100 text-blue-800'
            : 'bg-gray-100 text-gray-800'
        }`}>
          {subtask.status.replace('_', ' ')}
        </span>
      )}
    </div>
  </div>
);

// Filter Controls Component
const FilterControls = ({ 
  statusFilter, 
  priorityFilter, 
  onStatusChange, 
  onPriorityChange,
  onClearFilters 
}) => {
  const hasActiveFilters = statusFilter || priorityFilter;
  
  return (
    <div className="flex flex-wrap items-center gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
      <span className="text-sm font-medium text-gray-700">Filter by:</span>
      
      <select
        value={statusFilter}
        onChange={(e) => onStatusChange(e.target.value)}
        className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[#00C4B4] focus:border-transparent"
      >
        <option value="">All Statuses</option>
        <option value="pending">Pending</option>
        <option value="in_progress">In Progress</option>
        <option value="completed">Completed</option>
      </select>
      
      <select
        value={priorityFilter}
        onChange={(e) => onPriorityChange(e.target.value)}
        className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[#00C4B4] focus:border-transparent"
      >
        <option value="">All Priorities</option>
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
        <option value="urgent">Urgent</option>
      </select>
      
      {hasActiveFilters && (
        <button
          onClick={onClearFilters}
          className="text-sm text-[#00C4B4] hover:text-teal-600 font-medium transition-colors"
        >
          Clear Filters
        </button>
      )}
    </div>
  );
};

// Empty State Component
const EmptyState = ({ hasFilters }) => (
  <div className="text-center py-12">
    <div className="text-6xl mb-4">📝</div>
    <h3 className="text-lg font-medium text-gray-900 mb-2">
      {hasFilters ? "No tasks match your filters" : "No tasks found"}
    </h3>
    <p className="text-gray-500">
      {hasFilters 
        ? "Try adjusting your filters to see more tasks."
        : "Tasks will appear here once they're created for this project."
      }
    </p>
  </div>
);

// Main TaskListSection Component
const TaskListSection = ({ tasks = [], projectId, isProjectActive, onTaskCreated }) => {
  const [expandedTasks, setExpandedTasks] = useState({});
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);

  // Memoized filtered tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesStatus = !statusFilter || task.status === statusFilter;
      const matchesPriority = !priorityFilter || task.priority === priorityFilter;
      return matchesStatus && matchesPriority;
    });
  }, [tasks, statusFilter, priorityFilter]);

  // Task statistics
  const taskStats = useMemo(() => {
    const total = filteredTasks.length;
    const completed = filteredTasks.filter(t => t.status === 'completed').length;
    const inProgress = filteredTasks.filter(t => t.status === 'in_progress').length;
    const totalSubtasks = filteredTasks.reduce((sum, task) => sum + (task.subtasks?.length || 0), 0);
    
    return { total, completed, inProgress, totalSubtasks };
  }, [filteredTasks]);

  const toggleSubtasks = (taskId) => {
    setExpandedTasks((prev) => ({
      ...prev,
      [taskId]: !prev[taskId],
    }));
  };

  const handleTaskCreated = () => {
    setShowCreateTaskModal(false);
    // Call parent callback to refresh tasks
    if (onTaskCreated) {
      onTaskCreated();
    }
  };

  const clearFilters = () => {
    setStatusFilter("");
    setPriorityFilter("");
  };

  const hasActiveFilters = statusFilter || priorityFilter;

  return (
    <section className={`bg-white p-6 rounded-xl shadow-sm border border-[#E5E8EC] transition-opacity ${isProjectActive ? "opacity-100" : "opacity-60"}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <h3 className="text-xl font-semibold text-[#1A2A44] flex items-center space-x-2">
            <span role="img" aria-label="Tasks">📝</span>
            <span>Task List</span>
          </h3>
          <div className="flex items-center gap-2">
            <span className="bg-[#F3F4F6] text-[#6B7280] text-sm px-2 py-1 rounded-full">
              {taskStats.total} tasks
            </span>
            <span className="bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded-full">
              {taskStats.totalSubtasks} subtasks
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Progress indicator */}
          {taskStats.total > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>{taskStats.completed} completed</span>
              <span>•</span>
              <span>{taskStats.inProgress} in progress</span>
              <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden ml-2">
                <div 
                  className="h-full bg-[#00C4B4] transition-all duration-300"
                  style={{ width: `${taskStats.total > 0 ? (taskStats.completed / taskStats.total) * 100 : 0}%` }}
                />
              </div>
            </div>
          )}
          
          {/* New Task Button */}
          <button
            onClick={() => {
              if (!isProjectActive) return;
              setShowCreateTaskModal(true);
            }}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 shadow-sm ${
              isProjectActive 
                ? "bg-[#00C4B4] hover:bg-teal-600 text-white" 
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
            disabled={!isProjectActive}
            title={isProjectActive ? "Create new task" : "Project is inactive"}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* Filter Controls */}
      {tasks.length > 0 && (
        <FilterControls
          statusFilter={statusFilter}
          priorityFilter={priorityFilter}
          onStatusChange={setStatusFilter}
          onPriorityChange={setPriorityFilter}
          onClearFilters={clearFilters}
        />
      )}

      {/* Task List */}
      {filteredTasks.length === 0 ? (
        <EmptyState hasFilters={hasActiveFilters} />
      ) : (
        <ul className="space-y-4">
          {filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              isExpanded={expandedTasks[task.id] === true}
              onToggle={toggleSubtasks}
            />
          ))}
        </ul>
      )}

      {/* Create Task Modal */}
      {showCreateTaskModal && (
        <CreateTaskModal
          projectId={projectId}
          onClose={() => setShowCreateTaskModal(false)}
          onTaskCreated={handleTaskCreated}
        />
      )}
    </section>
  );
};

export default TaskListSection;