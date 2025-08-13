import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useEffect, useState, useCallback } from "react";
import apiClient from "../../../../api/apiClient";
import Toast from "../../../../components/modals/Toast";
import ConfirmToast from "../../../../components/modals/ConfirmToast";

// Components
import ProjectHeader from "../../shared/components/ProjectHeader";
import ProjectOverview from "../../shared/components/ProjectOverview";
import TeamMembersSection from "../../shared/components/TeamMembersSection";
import TaskListSection from "../../shared/components/TaskListSection";
import SubtaskAssignmentSection from "../../shared/components/SubtaskAssignmentSection";
import LoadingState from "../../../../components/common/LoadingState";
import NotFoundState from "../../../../components/common/NotFoundState";
import ComingSoonSection from "../../shared/components/ComingSoonSection";

// Modals
import EditProjectModal from "../modals/EditProjectModal";
import ManageMembersModal from "../modals/ManageMembersModal";
import CreateTaskModal from "../modals/CreateTaskModal";

// Utils
import { generateColumns } from "../../../../utils/projectUtils";

const ProjectManagerProjectDetail = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [subtasks, setSubtasks] = useState([]);
  const [developers, setDevelopers] = useState([]);
  const user = useSelector((state) => state.auth.user);
  const [confirmData, setConfirmData] = useState(null);
  const [allDevelopers, setAllDevelopers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [viewMode, setViewMode] = useState("subtasks");
  const [toast, setToast] = useState({ show: false, message: "" });

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);

  const fetchTasks = useCallback(async () => {
    try {
      const res = await apiClient.get(`/api/tasks/?project=${projectId}`);
      const taskList = res.data.results;
      setTasks(taskList);

      const allSubtasks = taskList.flatMap(task =>
        task.subtasks.map(subtask => ({
          ...subtask,
          parent_task: { id: task.id, title: task.title },
        }))
      );
      setSubtasks(allSubtasks);
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
          apiClient.get(`/api/my-developers/`)
        ]);
        setProject(projRes.data);
        setAllDevelopers(allDevsRes.data);

        await Promise.all([fetchTasks(), fetchDevelopers()]);
      } catch (err) {
        console.error("Error loading project data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [projectId, fetchTasks, fetchDevelopers]);

  const columns = generateColumns(
    subtasks.map(subtask => ({
      ...subtask,
      assigned_to: subtask.assigned_to?.id || 0,
    })),
    developers
  );
  const columnOrder = [0, ...developers.map(dev => dev.id)];

  const handleFieldUpdate = async (field, newValue) => {
    const previousValue = project[field];
    setProject(prev => ({ ...prev, [field]: newValue }));

    try {
      const res = await apiClient.patch(`/api/projects/${projectId}/`, {
        [field]: newValue,
      });
      setProject(res.data);
      return null;
    } catch (err) {
      setProject(prev => ({ ...prev, [field]: previousValue }));
      const apiErrors = err?.response?.data;

      if (apiErrors && typeof apiErrors === "object") {
        const firstField = Object.keys(apiErrors)[0];
        const firstMessage = apiErrors[firstField]?.[0] || "An error occurred.";
        setToast({
          show: true,
          message: firstMessage,
          type: "error"
        });
        return apiErrors;
      }

      setToast({
        show: true,
        message: "An unexpected error occurred.",
        type: "error"
      });
      
      return { general: ["An unexpected error occurred."] };
    }
  };

  const handleRemoveMember = async (member) => {
    const dev = developers.find(d => d.id === member.employee.id);
    const subtaskCount = dev?.assigned_subtasks_count || 0;

    if (member.employee.email === user.email) {
      setToast({
        show: true,
        type: "warning",
        message: `${member.employee.full_name} is the Project Manager, and cannot be removed`
      });
      return;
    }

    if (subtaskCount > 0) {
      setToast({
        show: true,
        type: "warning",
        message: `${member.employee.full_name} has ${subtaskCount} assigned subtask${subtaskCount > 1 ? 's' : ''}. Please unassign or reassign them before removing this member.`
      });
      return;
    }

    // Instead of window.confirm, show a modal
    setConfirmData({
      message: `Remove ${member.role} from the project?`,
      onConfirm: async () => {
        setConfirmData(null);
        const previousMembers = [...project.members];
        const previousDevelopers = [...developers];

        setProject(prev => ({
          ...prev,
          members: prev.members.filter(m => m.id !== member.id)
        }));
        setDevelopers(prev => prev.filter(d => d.id !== member.employee.id));

        try {
          await apiClient.delete(`/api/members/${member.id}/`);
          const [projRes, newDevs] = await Promise.all([
            apiClient.get(`/api/projects/${projectId}/`),
            fetchDevelopers()
          ]);
          setProject(projRes.data);
          setDevelopers(newDevs);
        } catch (err) {
          const detail = err?.response?.data?.detail;
          console.error("Failed to remove member:", detail || err.message || err);

          setProject(prev => ({ ...prev, members: previousMembers }));
          setDevelopers(previousDevelopers);
          setToast({
            show: true,
            message: detail || "Error removing member. Please try again.",
            type: "error"
          });
        }
      },
      onCancel: () => setConfirmData(null),
    });
  };  

  const handleSubtaskDragEnd = async ({ destination, source, draggableId }) => {
    if (!destination || destination.droppableId === source.droppableId) return;

    const subtaskId = parseInt(draggableId, 10);
    const newAssigneeId = parseInt(destination.droppableId, 10);
    const previousSubtasks = [...subtasks];

    if (isNaN(newAssigneeId)) return;

    setSubtasks(prev =>
      prev.map(st =>
        st.id === subtaskId
          ? { ...st, assigned_to: newAssigneeId === 0 ? null : { id: newAssigneeId } }
          : st
      )
    );

    try {
      await apiClient.patch(`/api/subtasks/${subtaskId}/`, {
        assigned_to_id: newAssigneeId === 0 ? null : newAssigneeId,
      });
      await fetchDevelopers();
    } catch (err) {
      console.error("Failed to update subtask assignment:", err);
      setSubtasks(previousSubtasks);
      setToast({
        show: true,
        message: "Assignment failed. Changes reverted.",
        type: "error"
      });
    }
  };

  const handleModalSuccess = async () => {
    try {
      const res = await apiClient.get(`/api/projects/${projectId}/`);
      setProject(res.data);
      await fetchDevelopers();
    } catch (err) {
      console.error("Error refreshing after modal success:", err);
    } finally {
      setShowMembersModal(false);
    }
  };

  if (loading) return <LoadingState />;
  if (!project) return <NotFoundState onBackToDashboard={() => navigate("/project_manager")} />;

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <ProjectHeader
        isProjectActive={project?.is_active}
        project={project}
        onBack={() => navigate('/')}
        onEdit={() => setShowEditModal(true)}
      />

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        <ProjectOverview
          isProjectActive={project?.is_active}
          project={project}
          onFieldUpdate={handleFieldUpdate}
        />
 
        <TeamMembersSection
          project={project}
          isProjectActive={project?.is_active}
          developers={developers}
          onManageTeam={() => setShowMembersModal(true)}
          onRemoveMember={handleRemoveMember}
        />

        <div className="flex justify-end items-center gap-4 mb-4">
          <span className="text-sm text-gray-700">View:</span>
          <button
            onClick={() => setViewMode("tasks")}
            disabled={viewMode === "tasks"}
            className={`px-3 py-1 rounded ${
              viewMode === "tasks"
                ? "bg-[#00C4B4] text-white"
                : "bg-gray-200 text-gray-600 hover:bg-gray-300"
            }`}
          >
            Task View
          </button>
          <button
            onClick={() => setViewMode("subtasks")}
            disabled={viewMode === "subtasks"}
            className={`px-3 py-1 rounded ${
              viewMode === "subtasks"
                ? "bg-[#00C4B4] text-white"
                : "bg-gray-200 text-gray-600 hover:bg-gray-300"
            }`}
          >
            Subtask View
          </button>
        </div>

        {viewMode === "subtasks" ? (
          <SubtaskAssignmentSection
            projectId={projectId}
            isProjectActive={project?.is_active}
            tasks={tasks}
            columns={columns}
            columnOrder={columnOrder}
            isDragging={isDragging}
            onCreateTask={() => setShowCreateTaskModal(true)}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={(result) => {
              if (project?.is_active) {
                setIsDragging(false);
                handleSubtaskDragEnd(result);
              } else {
                setToast({
                  show: true,
                  message: "Cannot assign subtasks in an inactive project.",
                  type: "error"
                });
              }
            }}
          />
        ) : (
          <TaskListSection
            tasks={tasks}
            projectId={projectId}
            isProjectActive={project?.is_active}
            onTaskCreated={fetchTasks}
          />
        )}

        <ComingSoonSection />
      </div>

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
      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, show: false })}
      />

      {confirmData && (
        <ConfirmToast
          message={confirmData.message}
          onConfirm={confirmData.onConfirm}
          onCancel={confirmData.onCancel}
        />
      )}
    </div>
  );
};

export default ProjectManagerProjectDetail;