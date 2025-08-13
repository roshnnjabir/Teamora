import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import apiClient from "../../../api/apiClient";
import Toast from "../../../components/modals/Toast.jsx";
import ConfirmToast from "../../../components/modals/ConfirmToast.jsx";

// Components
import ProjectHeader from "../../project/shared/components/ProjectHeader";
import ProjectOverview from "../../project/shared/components/ProjectOverview";
import TeamMembersSection from "../../project/shared/components/TeamMembersSection";
import TaskListSection from "../../project/shared/components/TaskListSection";
import SubtaskAssignmentSection from "../../project/shared/components/SubtaskAssignmentSection";
import LoadingState from "../../../components/common/LoadingState";
import NotFoundState from "../../../components/common/NotFoundState";
import ComingSoonSection from "../../project/shared/components/ComingSoonSection";

// Modals
import EditProjectModal from "../../project/manager/modals/EditProjectModal.jsx";
import ManageMembersModal from "../../project/manager/modals/ManageMembersModal.jsx";
import CreateTaskModal from "../../../components/modals/ProjectModals/CreateProjectModal.jsx";

// Utils
import { generateColumns } from "../../../utils/projectUtils";

const TenantAdminProjectDetail = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [subtasks, setSubtasks] = useState([]);
  const [developers, setDevelopers] = useState([]);
  const [allDevelopers, setAllDevelopers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [viewMode, setViewMode] = useState("subtasks");
  const [toast, setToast] = useState({ show: false, message: "", type: "" });

  const [confirmData, setConfirmData] = useState(null);

  const [showEditModal, setShowEditModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);

  const fetchTasks = useCallback(async () => {
    try {
      const res = await apiClient.get(`/api/tasks/?project=${projectId}`);
      setTasks(res.data.results || []);

      const allSubtasks = res.data.results.flatMap(task =>
        task.subtasks.map(sub => ({
          ...sub,
          parent_task: { id: task.id, title: task.title }
        }))
      );
      setSubtasks(allSubtasks);
    } catch (err) {
      console.error(err);
    }
  }, [projectId]);

  const fetchDevelopers = useCallback(async () => {
    try {
      const res = await apiClient.get(`/api/my-developers/?project_id=${projectId}`);
      setDevelopers(res.data || []);
      return res.data || [];
    } catch (err) {
      console.error(err);
      return [];
    }
  }, [projectId]);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [projRes, devsRes] = await Promise.all([
          apiClient.get(`/api/projects/${projectId}/`),
          apiClient.get(`/api/my-developers/`)
        ]);
        setProject(projRes.data);
        setAllDevelopers(devsRes.data || []);

        await Promise.all([fetchTasks(), fetchDevelopers()]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [projectId, fetchTasks, fetchDevelopers]);

  if (loading) return <LoadingState />;
  if (!project) return <NotFoundState onBackToDashboard={() => navigate("/project_manager")} />;

  const columns = generateColumns(subtasks, developers);
  const columnOrder = [0, ...developers.map(d => d.id)];

  const handleFieldUpdate = async (field, newValue) => {
    const prev = project[field];
    setProject(p => ({ ...p, [field]: newValue }));

    try {
      const res = await apiClient.patch(`/api/projects/${projectId}/`, { [field]: newValue });
      setProject(res.data);
    } catch (err) {
      setProject(p => ({ ...p, [field]: prev }));
      const apiErrors = err?.response?.data;
      const msg = apiErrors && typeof apiErrors === "object"
        ? apiErrors[Object.keys(apiErrors)[0]][0]
        : "Something went wrong.";
      setToast({ show: true, message: msg, type: "error" });
    }
  };

  const handleRemoveMember = async (  member) => {
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

    setConfirmData({
      message: `Remove ${member.role} from the project?`,
      onConfirm: async () => {
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
        } finally {
          setConfirmData(null);
        }
      },
      onCancel: () => setConfirmData(null)
    });
  };


  const handleSubtaskDragEnd = async ({ source, destination, draggableId }) => {
    if (!destination || destination.droppableId === source.droppableId) return;
    const subId = +draggableId;
    const newDev = +destination.droppableId;

    const backup = [...subtasks];
    setSubtasks(st =>
      st.map(s =>
        s.id === subId ? { ...s, assigned_to: newDev === 0 ? null : { id: newDev } } : s
      )
    );

    try {
      await apiClient.patch(`/api/subtasks/${subId}/`, {
        assigned_to_id: newDev === 0 ? null : newDev
      });
      await fetchDevelopers();
    } catch (err) {
      setSubtasks(backup);
      setToast({ show: true, message: "Assignment failed", type: "error" });
    }
  };

  const handleModalSuccess = async () => {
    const res = await apiClient.get(`/api/projects/${projectId}/`);
    setProject(res.data);
    await fetchDevelopers();
    setShowMembersModal(false);
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <ProjectHeader
        project={project}
        isProjectActive={project.is_active}
        onBack={() => navigate(-1)}
        onEdit={() => setShowEditModal(true)}
      />

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        <ProjectOverview project={project} isProjectActive={project.is_active} onFieldUpdate={handleFieldUpdate} />

        <TeamMembersSection
          project={project}
          developers={developers}
          isTenantAdmin={true}
          isProjectActive={project.is_active}
          onManageTeam={() => setShowMembersModal(true)}
          onRemoveMember={handleRemoveMember}
        />

        {/* <div className="flex justify-end space-x-2 mb-4">
          <button onClick={() => setViewMode("tasks")} disabled={viewMode === "tasks"} className={viewMode === "tasks" ? "bg-[#00C4B4] text-white px-3 py-1 rounded" : "bg-gray-200 px-3 py-1 rounded hover:bg-gray-300"}>Task View</button>
          <button onClick={() => setViewMode("subtasks")} disabled={viewMode === "subtasks"} className={viewMode === "subtasks" ? "bg-[#00C4B4] text-white px-3 py-1 rounded" : "bg-gray-200 px-3 py-1 rounded hover:bg-gray-300"}>Subtask View</button>
        </div>

        {viewMode === "subtasks" ? (
          <SubtaskAssignmentSection
            projectId={projectId}
            isProjectActive={project.is_active}
            isTenantAdmin={true}
            tasks={tasks}
            subtasks={subtasks}
            developers={developers}
            isDragging={isDragging}
            onCreateTask={() => setShowCreateTaskModal(true)}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={handleSubtaskDragEnd}
          />
        ) : (
          <TaskListSection tasks={tasks} projectId={projectId} isProjectActive={project.is_active} isTenantAdmin={true} onTaskCreated={fetchTasks} />
        )} */}

        <ComingSoonSection />
      </div>

      {showEditModal && (
        <EditProjectModal project={project} onClose={() => setShowEditModal(false)} onUpdate={updated => { setProject(updated); setShowEditModal(false); }} />
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
        <CreateTaskModal projectId={projectId} onClose={() => setShowCreateTaskModal(false)} onTaskCreated={fetchTasks} />
      )}

      {confirmData && (
        <ConfirmToast
          message={confirmData.message}
          onConfirm={confirmData.onConfirm}
          onCancel={confirmData.onCancel}
        />
      )}

      <Toast {...toast} onClose={() => setToast(prev => ({ ...prev, show: false }))} />
    </div>
  );
};

export default TenantAdminProjectDetail;