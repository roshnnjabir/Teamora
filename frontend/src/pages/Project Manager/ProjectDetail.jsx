import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback, useMemo } from "react";
import apiClient from "../../contexts/apiClient";

import EditProjectModal from "./EditProjectModal";
import InlineEditField from "./InlineEditField";
import ManageMembersModal from "./ManageMembersModal";
import CreateTaskModal from "./CreateTaskModal";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

// Utility Functions
const getStatusColor = (status) => {
  const map = {
    completed: 'bg-green-100 text-green-800',
    in_progress: 'bg-blue-100 text-blue-800',
    on_hold: 'bg-yellow-100 text-yellow-800',
    planning: 'bg-gray-100 text-gray-800',
  };
  return map[status] || 'bg-gray-100 text-gray-800';
};

const getPriorityColor = (priority) => {
  const map = {
    high: 'text-red-600',
    medium: 'text-yellow-600',
    low: 'text-green-600',
  };
  return map[priority] || 'text-gray-600';
};

const getInitials = (name) =>
  name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';

const ProjectManagerProjectDetail = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [developers, setDevelopers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showEditModal, setShowEditModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);

  // Fetch tasks for current project
  const fetchTasks = useCallback(async () => {
    try {
      const res = await apiClient.get(`/api/tasks/?project=${projectId}`);
      setTasks(res.data);
    } catch (err) {
      console.error("Failed to fetch tasks", err);
    }
  }, [projectId]);

  // Fetch project and developer info
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [projRes, devRes] = await Promise.all([
          apiClient.get(`/api/projects/${projectId}/`),
          apiClient.get("/api/my-developers/"),
        ]);
        setProject(projRes.data);
        setDevelopers(devRes.data);
        await fetchTasks();
      } catch (err) {
        console.error("Error loading project data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [projectId, fetchTasks]);

  const handleFieldUpdate = async (field, newValue) => {
    try {
      const res = await apiClient.patch(`/api/projects/${projectId}/`, {
        [field]: newValue,
      });
      setProject(res.data);
      return null;
    } catch (err) {
      const apiErrors = err?.response?.data;

      if (apiErrors && typeof apiErrors === 'object') {
        return apiErrors;
      }

      return { general: ["An unexpected error occurred."] };
    }
  };

  const handleTaskDragEnd = async ({ destination, draggableId }) => {
    if (!destination) return;
    const taskId = parseInt(draggableId);
    const newAssigneeId = parseInt(destination.droppableId);

    try {
      await apiClient.patch(`/api/tasks/${taskId}/`, {
        assigned_to: newAssigneeId === 0 ? null : newAssigneeId,
      });
      await fetchTasks();
    } catch (error) {
      console.error("Failed to update task assignment:", error);
    }
  };

  // Memoize columns to avoid rebuilds
  const columns = useMemo(() => {
    const grouped = {
      0: {
        id: 0,
        title: "Unassigned",
        tasks: tasks.filter(t => !t.assigned_to),
      },
    };

    developers.forEach((dev) => {
      grouped[dev.id] = {
        id: dev.id,
        title: dev.full_name,
        subtitle: dev.email,
        tasks: tasks.filter(t => t.assigned_to === dev.id),
      };
    });

    return grouped;
  }, [tasks, developers]);

  const columnOrder = useMemo(() => [0, ...developers.map(dev => dev.id)], [developers]);

  // Render Loading State
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB]">
        <div className="flex items-center space-x-3">
          <div className="animate-spin h-8 w-8 rounded-full border-b-2 border-[#00C4B4]" />
          <span className="text-[#2F3A4C] font-medium">Loading project details...</span>
        </div>
      </div>
    );
  }

  // Render Not Found
  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB]">
        <div className="text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-2xl font-bold text-[#2F3A4C] mb-2">Project Not Found</h2>
          <p className="text-[#6B7280] mb-6">The project you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => navigate('/project_manager')}
            className="bg-[#00C4B4] hover:bg-teal-600 text-white px-6 py-3 rounded-lg transition"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Header Section */}
      <div className="bg-white border-b border-[#E5E8EC]">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center space-x-2 text-[#6B7280] hover:text-[#00C4B4] transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="font-medium">Back to Projects</span>
              </button>
            </div>
            <button
              onClick={() => setShowEditModal(true)}
              className="flex items-center space-x-2 bg-[#00C4B4] hover:bg-teal-600 text-white px-4 py-2 rounded-lg transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span>Edit Project</span>
            </button>
          </div>
          
          <div className="mt-6">
            <div className="flex items-center space-x-4 mb-4">
              <h1 className="text-3xl font-bold text-[#1A2A44]">{project.name}</h1>
              <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusColor(project.status)}`}>
                {project.status || 'planning'}
              </span>
            </div>
            <p className="text-[#6B7280] text-lg max-w-3xl">{project.description}</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Project Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <InlineEditField
            name="start_date"
            label="Start Date"
            value={project.start_date}
            type="date"
            onSave={(val) => handleFieldUpdate("start_date", val)}
            icon="📅"
          />
          <InlineEditField
            name="end_date"
            label="End Date"
            value={project.end_date || ""}
            type="date"
            onSave={(val) => handleFieldUpdate("end_date", val)}
            icon="🏁"
          />
          <InlineEditField
            name="status"
            label="Status"
            value={project.status}
            type="select"
            options={["planning", "in_progress", "completed", "on_hold"]}
            onSave={(val) => handleFieldUpdate("status", val)}
            icon="📊"
          />
          <InlineEditField
            name="priority"
            label="Priority"
            value={project.priority}
            type="select"
            options={["low", "medium", "high"]}
            onSave={(val) => handleFieldUpdate("priority", val)}
            icon="🔥"
            valueClassName={getPriorityColor(project.priority)}
          />
        </div>

        {/* Team Members Section */}
        <div className="bg-white rounded-xl shadow-sm border border-[#E5E8EC] p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-[#1A2A44] flex items-center space-x-2">
              <span>👥</span>
              <span>Team Members</span>
              <span className="bg-[#F3F4F6] text-[#6B7280] text-sm px-2 py-1 rounded-full">
                {project.members?.length || 0}
              </span>
            </h2>
            <button
              onClick={() => setShowMembersModal(true)}
              className="bg-[#00C4B4] hover:bg-teal-600 text-white px-4 py-2 rounded-lg transition flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Manage Team</span>
            </button>
          </div>
          
          {project.members?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {project.members.map((member) => (
                <div key={member.id} className="flex items-center space-x-3 p-3 bg-[#F9FAFB] rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-[#00C4B4] text-white text-sm font-medium flex items-center justify-center">
                    {getInitials(member.full_name)}
                  </div>
                  <div>
                    <p className="font-medium text-[#1A2A44]">{member.full_name}</p>
                    <p className="text-sm text-[#6B7280]">{member.email}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">👥</div>
              <p className="text-[#6B7280] mb-4">No team members assigned yet</p>
              <button
                onClick={() => setShowMembersModal(true)}
                className="text-[#00C4B4] hover:underline font-medium"
              >
                Add your first team member
              </button>
            </div>
          )}
        </div>

        {/* Task Assignment Section */}
        <div className="bg-white rounded-xl shadow-sm border border-[#E5E8EC] p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-[#1A2A44] flex items-center space-x-2">
              <span>📋</span>
              <span>Task Assignment</span>
              <span className="bg-[#F3F4F6] text-[#6B7280] text-sm px-2 py-1 rounded-full">
                {tasks.length}
              </span>
            </h2>
            <button
              onClick={() => setShowCreateTaskModal(true)}
              className="bg-[#00C4B4] hover:bg-teal-600 text-white px-4 py-2 rounded-lg transition flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>New Task</span>
            </button>
          </div>

          <DragDropContext onDragEnd={handleTaskDragEnd}>
            <div className="overflow-x-auto pb-4">
              <div className="flex space-x-6 min-w-max">
                {columnOrder.map((colId) => (
                  <Droppable key={colId} droppableId={colId.toString()}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`min-w-[320px] w-80 bg-[#F9FAFB] rounded-lg p-4 border-2 transition-colors ${
                          snapshot.isDraggingOver ? 'border-[#00C4B4] bg-teal-50' : 'border-transparent'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="font-semibold text-[#1A2A44]">{columns[colId].title}</h4>
                            {columns[colId].subtitle && (
                              <p className="text-sm text-[#6B7280]">{columns[colId].subtitle}</p>
                            )}
                          </div>
                          <span className="bg-white text-[#6B7280] text-xs font-medium px-2 py-1 rounded-full">
                            {columns[colId].tasks.length}
                          </span>
                        </div>
                        
                        <div className="space-y-3">
                          {columns[colId].tasks.map((task, index) => (
                            <Draggable
                              key={task.id}
                              draggableId={task.id.toString()}
                              index={index}
                            >
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`bg-white p-4 rounded-lg border shadow-sm cursor-grab active:cursor-grabbing transition-shadow ${
                                    snapshot.isDragging ? 'shadow-lg ring-2 ring-[#00C4B4] ring-opacity-50' : 'hover:shadow-md'
                                  }`}
                                >
                                  <h5 className="font-medium text-[#1A2A44] mb-2">{task.title}</h5>
                                  {task.description && (
                                    <p className="text-sm text-[#6B7280] mb-3">{task.description}</p>
                                  )}
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="text-[#6B7280]">
                                      {task.due_date ? `Due: ${task.due_date}` : 'No due date'}
                                    </span>
                                    {task.priority && (
                                      <span className={`font-medium ${getPriorityColor(task.priority)}`}>
                                        {task.priority.toUpperCase()}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                          
                          {columns[colId].tasks.length === 0 && (
                            <div className="text-center py-8 text-[#6B7280]">
                              <div className="text-2xl mb-2">📝</div>
                              <p className="text-sm">No tasks assigned</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </Droppable>
                ))}
              </div>
            </div>
          </DragDropContext>
        </div>

        {/* Coming Soon Section */}
        <div className="bg-gradient-to-r from-[#00C4B4] to-teal-600 rounded-xl p-6 text-white">
          <div className="flex items-center space-x-3">
            <div className="text-3xl">🚀</div>
            <div>
              <h3 className="text-lg font-semibold">Coming Soon</h3>
              <p className="text-teal-100">Advanced Kanban boards, detailed reports, and time tracking features are on the way!</p>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showEditModal && (
        <EditProjectModal
          project={project}
          onClose={() => setShowEditModal(false)}
          onUpdate={(updated) => {
            setProject(updated);
            setShowEditModal(false);
          }}
        />
      )}

      {showMembersModal && (
        <ManageMembersModal
          projectId={project.id}
          developers={developers}
          currentMembers={project.members || []}
          onClose={() => setShowMembersModal(false)}
          onSuccess={async () => {
            const res = await apiClient.get(`/api/projects/${projectId}/`);
            setProject(res.data);
            setShowMembersModal(false);
          }}
        />
      )}

      {showCreateTaskModal && (
        <CreateTaskModal
          projectId={projectId}
          onClose={() => setShowCreateTaskModal(false)}
          onTaskCreated={fetchTasks}
        />
      )}
    </div>
  );
};

export default ProjectManagerProjectDetail;
