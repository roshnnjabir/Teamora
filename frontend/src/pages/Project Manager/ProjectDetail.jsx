import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef, useCallback } from "react";
import apiClient from "../../contexts/apiClient";

import EditProjectModal from "./EditProjectModal";
import InlineEditField from "./InlineEditField";
import ManageMembersModal from "./ManageMembersModal";
import CreateTaskModal from "./CreateTaskModal";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

import { getStatusColor, getPriorityColor, getInitials, generateColumns } from "../../utils/projectUtils";

const ScrollContainer = ({ children }) => {
  const containerRef = useRef(null);
  const [isDown, setIsDown] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleMouseDown = (e) => {
    setIsDown(true);
    setStartX(e.pageX - containerRef.current.offsetLeft);
    setScrollLeft(containerRef.current.scrollLeft);
  };

  const handleMouseLeave = () => setIsDown(false);
  const handleMouseUp = () => setIsDown(false);

  const handleMouseMove = (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - containerRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    containerRef.current.scrollLeft = scrollLeft - walk;
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseLeave={handleMouseLeave}
      onMouseUp={handleMouseUp}
      onMouseMove={handleMouseMove}
      className="overflow-x-auto cursor-grab active:cursor-grabbing select-none scrollbar-hidden"
      style={{ whiteSpace: "nowrap" }}
    >
      {children}
    </div>
  );
};

const ProjectManagerProjectDetail = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [developers, setDevelopers] = useState([]);
  const [allDevelopers, setAllDevelopers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);

  // Generate columns dynamically
  const columns = generateColumns(tasks, developers);
  const columnOrder = [0, ...developers.map(dev => dev.id)];

  // Fetch tasks for current project
  const fetchTasks = useCallback(async () => {
    try {
      const res = await apiClient.get(`/api/tasks/?project=${projectId}`);
      setTasks(res.data);
    } catch (err) {
      console.error("Failed to fetch tasks", err);
    }
  }, [projectId]);

  const fetchDevelopers = useCallback(async () => {
    try {
      const res = await apiClient.get(`/api/my-developers/?project_id=${projectId}`);
      setDevelopers(res.data);
      return res.data;
    } catch (err) {
      console.error("Failed to fetch developers", err);
      return [];
    }
  }, [projectId]);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [projRes, allDevsRes] = await Promise.all([
          apiClient.get(`/api/projects/${projectId}/`),
          apiClient.get(`/api/my-developers/`),
        ]);
        setProject(projRes.data);
        setAllDevelopers(allDevsRes.data);
        await fetchTasks();
        await fetchDevelopers();
      } catch (err) {
        console.error("Error loading project data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [projectId, fetchTasks, fetchDevelopers]);

  // Optimistic UI for field updates
  const handleFieldUpdate = async (field, newValue) => {
    const previousValue = project[field];
    
    // Optimistic update
    setProject(prev => ({ ...prev, [field]: newValue }));

    try {
      const res = await apiClient.patch(`/api/projects/${projectId}/`, {
        [field]: newValue,
      });
      setProject(res.data);
      return null;
    } catch (err) {
      // Rollback on error
      setProject(prev => ({ ...prev, [field]: previousValue }));
      
      const apiErrors = err?.response?.data;
      if (apiErrors && typeof apiErrors === 'object') {
        return apiErrors;
      }
      return { general: ["An unexpected error occurred."] };
    }
  };

  // Optimistic UI for member removal
  const handleRemoveMember = async (member) => {
    const confirmed = window.confirm(`Are you sure you want to remove ${member.full_name} from the project?`);
    if (!confirmed) return;

    const previousMembers = [...project.members];
    const previousDevelopers = [...developers];

    // Optimistic update - remove member immediately
    setProject(prev => ({
      ...prev,
      members: prev.members.filter(m => m.id !== member.id)
    }));
    
    setDevelopers(prev => prev.filter(d => d.id !== member.employee.id));

    try {
      await apiClient.delete(`/api/members/${member.id}/`);
      
      // Fetch fresh data to ensure consistency
      const [projRes, newDevs] = await Promise.all([
        apiClient.get(`/api/projects/${projectId}/`),
        fetchDevelopers()
      ]);
      
      setProject(projRes.data);
      setDevelopers([...newDevs]);
    } catch (error) {
      console.error("Failed to remove member:", error);
      
      // Rollback on error
      setProject(prev => ({ ...prev, members: previousMembers }));
      setDevelopers(previousDevelopers);
      
      alert("Error removing member. Please try again.");
    }
  };

  // Optimistic UI for task drag & drop
  const handleTaskDragEnd = async ({ destination, source, draggableId }) => {
    if (!destination) return;
    if (destination.droppableId === source.droppableId) return;

    const taskId = parseInt(draggableId);
    const newAssigneeId = parseInt(destination.droppableId);
    const previousTasks = [...tasks];

    // Handle delete zone
    if (destination.droppableId === "delete-zone") {
      const confirmed = window.confirm("Are you sure you want to delete this task?");
      if (!confirmed) return;

      // Optimistic update - remove task immediately
      setTasks(prev => prev.filter(task => task.id !== taskId));

      try {
        await apiClient.delete(`/api/tasks/${taskId}/`);
      } catch (error) {
        console.error("Failed to delete task:", error);
        // Rollback on error
        setTasks(previousTasks);
        alert("Error deleting task. Changes reverted.");
      }
      return;
    }

    // Optimistic update - update task assignment immediately
    const updatedTasks = tasks.map(task => 
      task.id === taskId 
        ? { ...task, assigned_to: newAssigneeId === 0 ? null : newAssigneeId } 
        : task
    );
    setTasks(updatedTasks);

    try {
      await apiClient.patch(`/api/tasks/${taskId}/`, {
        assigned_to: newAssigneeId === 0 ? null : newAssigneeId,
      });
    } catch (error) {
      console.error("Failed to update task assignment:", error);
      // Rollback on error
      setTasks(previousTasks);
      alert("Assignment failed. Changes reverted.");
    }
  };

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
                <div key={member.id} className="group relative flex items-center space-x-3 p-3 bg-[#F9FAFB] rounded-lg hover:bg-gray-100 transition" >
                  <div className="w-10 h-10 rounded-full bg-[#00C4B4] text-white text-sm font-medium flex items-center justify-center">
                    {getInitials(member.employee.full_name)}
                  </div>
                  <div>
                    <p className="font-medium text-[#1A2A44]">{member.employee.full_name}</p>
                    <p className="text-sm text-[#6B7280]">{member.employee.email}</p>
                  </div>

                  <button
                    title="Remove Member"
                    onClick={() => handleRemoveMember(member)}
                    className="absolute top-2 right-2 hidden group-hover:block text-red-500 hover:text-red-700"
                  >
                    🗑️
                  </button>
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

          <DragDropContext 
            onDragStart={() => setIsDragging(true)}   
            onDragEnd={(result) => {
              setIsDragging(false);
              handleTaskDragEnd(result);
            }}
          >
            <ScrollContainer>
              <div className="flex space-x-6 min-w-max">
                {columnOrder.map((colId) => (
                  <Droppable key={colId} droppableId={colId.toString()} isDropDisabled={columns[colId].isFormer}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`min-w-[320px] w-80 rounded-lg p-4 border-2 transition-colors
                          ${columns[colId].isFormer ? 'bg-gray-100 border-gray-300 opacity-60 cursor-not-allowed' :
                            snapshot.isDraggingOver ? 'border-[#00C4B4] bg-teal-50' : 'bg-[#F9FAFB] border-transparent'
                          }
                        `}
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
                                  className={`bg-white p-4 rounded-lg border shadow-sm cursor-grab active:cursor-grabbing transition-all duration-200 ${
                                    snapshot.isDragging ? 'shadow-xl ring-2 ring-[#00C4B4] ring-opacity-50 transform rotate-2 scale-105' : 'hover:shadow-md'
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
            </ScrollContainer>
            
            {/* Enhanced Delete Zone with Better Animation */}
            <Droppable droppableId="delete-zone">
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`
                    mt-8 flex justify-center items-center h-32 rounded-lg border-2 border-dashed transition-all duration-300 ease-in-out
                    ${isDragging ? 'opacity-100 transform scale-100' : 'opacity-0 transform scale-95 pointer-events-none'}
                    ${snapshot.isDraggingOver ? 'bg-red-100 border-red-500 shadow-lg' : 'border-gray-300 bg-gray-50'}
                  `}
                >
                  <div className={`text-lg flex items-center space-x-2 transition-colors duration-200 ${
                    snapshot.isDraggingOver ? 'text-red-700' : 'text-red-600'
                  }`}>
                    <span className="text-2xl">🗑️</span>
                    <span className="font-medium">Drag here to delete task</span>
                  </div>
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
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
          developers={allDevelopers}
          currentMembers={project.members || []}
          onClose={() => setShowMembersModal(false)}
          onSuccess={async () => {
            const res = await apiClient.get(`/api/projects/${projectId}/`);
            setProject(res.data);
            await fetchDevelopers();
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