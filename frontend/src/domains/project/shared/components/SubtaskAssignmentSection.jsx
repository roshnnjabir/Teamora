import { useState, useMemo } from "react";
import { DragDropContext } from "@hello-pangea/dnd";
import ScrollContainer from "./ScrollContainer";
import TaskColumn from "./TaskColumn";
import DeleteZone from "./DeleteZone";
import SubtaskModal from "./SubtaskModal";
import apiClient from "../../contexts/apiClient";

// Statistics Component
const AssignmentStats = ({ columns, totalSubtasks }) => {
  const stats = useMemo(() => {
    const unassigned = columns[0]?.items?.length || 0;
    const assigned = totalSubtasks - unassigned;
    const assignmentRate = totalSubtasks > 0 ? (assigned / totalSubtasks) * 100 : 0;
    
    return {
      total: totalSubtasks,
      assigned,
      unassigned,
      assignmentRate: Math.round(assignmentRate)
    };
  }, [columns, totalSubtasks]);

  return (
    <div className="flex items-center gap-4 text-sm text-gray-600">
      <div className="flex items-center gap-2">
        <span className="w-3 h-3 bg-[#00C4B4] rounded-full"></span>
        <span>{stats.assigned} assigned</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-3 h-3 bg-gray-400 rounded-full"></span>
        <span>{stats.unassigned} unassigned</span>
      </div>
      <div className="flex items-center gap-2">
        <span>Assignment Rate:</span>
        <div className="flex items-center gap-1">
          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#00C4B4] transition-all duration-300"
              style={{ width: `${stats.assignmentRate}%` }}
            />
          </div>
          <span className="font-medium">{stats.assignmentRate}%</span>
        </div>
      </div>
    </div>
  );
};

// View Controls Component
const ViewControls = ({ 
  showCompletedTasks, 
  onToggleCompleted,
  sortOrder,
  onSortChange,
  searchTerm,
  onSearchChange 
}) => (
  <div className="flex flex-wrap items-center gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-gray-700">View:</span>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={showCompletedTasks}
          onChange={(e) => onToggleCompleted(e.target.checked)}
          className="rounded border-gray-300 text-[#00C4B4] focus:ring-[#00C4B4]"
        />
        <span>Show completed</span>
      </label>
    </div>
    
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-gray-700">Sort:</span>
      <select
        value={sortOrder}
        onChange={(e) => onSortChange(e.target.value)}
        className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[#00C4B4] focus:border-transparent"
      >
        <option value="status">Status</option>
        <option value="created_date">Created Date</option>
        <option value="due_date">Due Date</option>
        <option value="title">Title</option>
      </select>
    </div>
    
    <div className="flex items-center gap-2 flex-1 max-w-xs">
      <span className="text-sm font-medium text-gray-700">Search:</span>
      <div className="relative flex-1">
        <input
          type="text"
          placeholder="Search subtasks..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full text-sm border border-gray-300 rounded px-3 py-1 pl-8 focus:outline-none focus:ring-2 focus:ring-[#00C4B4] focus:border-transparent"
        />
        <svg 
          className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
    </div>
  </div>
);

// Drag Instructions Component
const DragInstructions = ({ isDragging, hasSubtasks }) => {
  if (!hasSubtasks) return null;
  
  return (
    <div className={`transition-all duration-200 ${isDragging ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
        <div className="flex items-center gap-2 text-blue-800">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
          </svg>
          <span className="text-sm font-medium">
            Drag subtasks between columns to assign them • Drop in the delete zone to remove
          </span>
        </div>
      </div>
    </div>
  );
};

// Empty State Component
const EmptyState = () => (
  <div className="text-center py-12">
    <div className="text-6xl mb-4">📋</div>
    <h3 className="text-lg font-medium text-gray-900 mb-2">
      No subtasks to assign
    </h3>
    <p className="text-gray-500 mb-4">
      Create tasks with subtasks to start managing assignments.
    </p>
  </div>
);


// Main SubtaskAssignmentSection Component
const SubtaskAssignmentSection = ({
  projectId,
  isProjectActive,
  columns = {},
  columnOrder = [],
  isDragging = false,
  onCreateTask,
  onDragStart,
  onDragEnd,
  onSubtaskCreated,
}) => {
  const [showCompletedTasks, setShowCompletedTasks] = useState(false);
  const [sortOrder, setSortOrder] = useState("priority");
  const [searchTerm, setSearchTerm] = useState("");
  const [showSubtaskModal, setShowSubtaskModal] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [developers, setDevelopers] = useState([]);

  const handleOpenSubtaskModal = async () => {
    try {
      const [taskRes, devRes] = await Promise.all([
        apiClient.get(`/api/projects/${projectId}/tasks/`),
        apiClient.get(`/api/my-developers/?project_id=${projectId}`)
      ]);
      setTasks(taskRes.data);
      setDevelopers(devRes.data);
      setShowSubtaskModal(true);
    } catch (err) {
      console.error("Failed to fetch tasks or developers", err);
    }
  };

  const handleCloseSubtaskModal = () => {
    setShowSubtaskModal(false);
  };

  // Calculate totals and statistics
  const totalSubtasks = useMemo(() => {
    return Object.values(columns).reduce((sum, col) => sum + (col?.items?.length || 0), 0);
  }, [columns]);

  // Filter and sort columns based on user preferences
  const processedColumns = useMemo(() => {
    const processed = {};
    
    Object.entries(columns).forEach(([colId, column]) => {
      if (!column || !column.items) {
        processed[colId] = column;
        return;
      }

      let filteredItems = column.items;

      // Filter by search term
      if (searchTerm) {
        filteredItems = filteredItems.filter(item =>
          item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.description?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      // Filter by completion status
      if (!showCompletedTasks) {
        filteredItems = filteredItems.filter(item => item.status !== 'completed');
      }

      // Sort items
      filteredItems.sort((a, b) => {
        switch (sortOrder) {
          case 'status':
            const statusOrder = { todo: 1, in_progress: 2, completed: 3 };
            return (statusOrder[a.status] || 0) - (statusOrder[b.status] || 0);
          case 'created_date':
            return new Date(b.created_at || 0) - new Date(a.created_at || 0);
          case 'due_date':
            if (!a.due_date && !b.due_date) return 0;
            if (!a.due_date) return 1;
            if (!b.due_date) return -1;
            return new Date(a.due_date) - new Date(b.due_date);
          case 'title':
            return (a.title || '').localeCompare(b.title || '');
          default:
            return 0;
        }
      });

      processed[colId] = {
        ...column,
        items: filteredItems
      };
    });

    return processed;
  }, [columns, searchTerm, showCompletedTasks, sortOrder]);

  const handleCreateSubtask = async (form) => {
    try {
      const res = await apiClient.post(`/api/subtasks/`, {
        title: form.title,
        description: form.description || "",
        task_id: form.taskId,
        assigned_to_id: form.assignedToId || null,
        status: form.status,
        due_date: form.due_date || null,
        priority: form.priority,
        estimated_hours: form.estimated_hours || null
      });

      setShowSubtaskModal(false);

      if (onSubtaskCreated) {
        await onSubtaskCreated();
      }
    } catch (err) {
      console.error("Failed to create subtask", err);
    }
  };


  // Enhanced drag handlers with better feedback
  const handleDragStart = (result) => {
    onDragStart?.(result);
  };

  const handleDragEnd = (result) => {
    onDragEnd?.(result);
  };

  // Check if there are any subtasks
  const hasSubtasks = totalSubtasks > 0;

  return (
    <section className={`bg-white p-6 rounded-xl shadow-sm border border-[#E5E8EC] transition-opacity ${isProjectActive ? "opacity-100" : "opacity-60"}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <h2 className="text-xl font-semibold text-[#1A2A44] flex items-center space-x-2">
            <span role="img" aria-label="Subtasks">📋</span>
            <span>Subtask Assignment</span>
          </h2>
          <span className="bg-[#F3F4F6] text-[#6B7280] text-sm px-2 py-1 rounded-full">
            {totalSubtasks} subtasks
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={async () => {
              if (!isProjectActive) return;
              await handleOpenSubtaskModal();
            }}
            disabled={!isProjectActive}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 shadow-sm ${
              isProjectActive 
                ? "bg-[#00C4B4] hover:bg-teal-600 text-white"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
            title={isProjectActive ? "Create new subtask" : "Project is inactive"}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>New Subtask</span>
          </button>
        </div>
      </div>

      {/* Assignment Statistics */}
      {hasSubtasks && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <AssignmentStats columns={processedColumns} totalSubtasks={totalSubtasks} />
        </div>
      )}

      {/* View Controls */}
      {hasSubtasks && (
        <ViewControls
          showCompletedTasks={showCompletedTasks}
          onToggleCompleted={setShowCompletedTasks}
          sortOrder={sortOrder}
          onSortChange={setSortOrder}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />
      )}

      <SubtaskModal
        show={showSubtaskModal}
        onClose={handleCloseSubtaskModal}
        tasks={tasks}
        developers={developers}
        onSubmit={handleCreateSubtask}
      />

      {/* Drag Instructions */}
      <DragInstructions isDragging={isDragging} hasSubtasks={hasSubtasks} />

      {/* Drag and Drop Context */}
      {hasSubtasks ? (
        <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="relative">
            <ScrollContainer>
              <div className="flex space-x-6 min-w-max pb-4">
                {columnOrder.map((colId) => {
                  const column = processedColumns[colId];
                  if (!column) return null;
                  
                  return (
                    <TaskColumn
                      key={colId}
                      columnId={colId}
                      column={column}
                      isDragging={isDragging}
                      searchTerm={searchTerm}
                    />
                  );
                })}
              </div>
            </ScrollContainer>

            {/* Delete Zone */}
            <DeleteZone isDragging={isDragging} />
          </div>
        </DragDropContext>
      ) : (
        <EmptyState />
      )}
    </section>
  );
};

export default SubtaskAssignmentSection;