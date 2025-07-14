// ProjectManagerProjectDetail.jsx
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import apiClient from "../../contexts/apiClient";

// Import all the new components
import ProjectHeader from "../../components/ProjectDetail/ProjectHeader.jsx";
import ProjectOverview from "../../components/ProjectDetail/ProjectOverview.jsx";
import TeamMembersSection from "../../components/ProjectDetail/TeamMembersSection.jsx";
import TaskAssignmentSection from "../../components/ProjectDetail/TaskAssignmentSection.jsx";
import LoadingState from "../../components/ProjectDetail/LoadingState.jsx";
import NotFoundState from "../../components/ProjectDetail/NotFoundState.jsx";
import ComingSoonSection from "../../components/ProjectDetail/ComingSoonSection.jsx";

// Import existing modals
import EditProjectModal from "./EditProjectModal.jsx";
import ManageMembersModal from "./ManageMembersModal.jsx";
import CreateTaskModal from "./CreateTaskModal.jsx";

import { generateColumns } from "../../utils/projectUtils.jsx";

const ProjectManagerProjectDetail = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();

  // State management
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [developers, setDevelopers] = useState([]);
  const [allDevelopers, setAllDevelopers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);

  // Generate columns dynamically
  const columns = generateColumns(tasks, developers);
  const columnOrder = [0, ...developers.map(dev => dev.id)];

  // API calls
  const fetchTasks = useCallback(async () => {
    try {
      const res = await apiClient.get(`/api/tasks/?project=${projectId}`);
      setTasks(res.data.results);
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

  // Event handlers
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

  const handleTaskDragEnd = async ({ destination, source, draggableId }) => {
    if (!destination) return;
    if (destination.droppableId === source.droppableId) return;

    const taskId = parseInt(draggableId);
    const newAssigneeId = parseInt(destination.droppableId);
    const previousTasks = [...tasks];

    // Handle delete zone
    if (destination.droppableId === "delete-zone") {
      const confirmed = window.confirm("Are you sure you want to delete this task?");
      if (!confirmed) {
        // Re-render without deleting
        setTasks(previousTasks);
        return;
      }
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

  const handleModalSuccess = async () => {
    const res = await apiClient.get(`/api/projects/${projectId}/`);
    setProject(res.data);
    await fetchDevelopers();
    setShowMembersModal(false);
  };

  // Render loading state
  if (loading) {
    return <LoadingState />;
  }

  // Render not found state
  if (!project) {
    return <NotFoundState onBackToDashboard={() => navigate('/project_manager')} />;
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <ProjectHeader 
        project={project} 
        onBack={() => navigate(-1)}
        onEdit={() => setShowEditModal(true)}
      />

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        <ProjectOverview 
          project={project} 
          onFieldUpdate={handleFieldUpdate} 
        />

        <TeamMembersSection 
          project={project}
          onManageTeam={() => setShowMembersModal(true)}
          onRemoveMember={handleRemoveMember}
        />

        <TaskAssignmentSection 
          tasks={tasks}
          columns={columns}
          columnOrder={columnOrder}
          isDragging={isDragging}
          onCreateTask={() => setShowCreateTaskModal(true)}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={(result) => {
            setIsDragging(false);
            handleTaskDragEnd(result);
          }}
        />

        <ComingSoonSection />
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
          onSuccess={handleModalSuccess}
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