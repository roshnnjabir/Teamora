import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import apiClient from "../../contexts/apiClient";
import EditProjectModal from "./EditProjectModal";
import ManageMembersModal from "./ManageMembersModal";

const ProjectManagerProjectDetail = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [myDevelopers, setMyDevelopers] = useState([]);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const res = await apiClient.get(`/api/projects/${projectId}/`);
        setProject(res.data);
      } catch (error) {
        console.error("Failed to load project", error);
      } finally {
        setLoading(false);
      }
    };
    const fetchMyDevelopers = async () => {
      try {
        const res = await apiClient.get("/api/my-developers/");
        setMyDevelopers(res.data);
      } catch (error) {
        console.error("Failed to fetch developers", error);
      }
    };

    fetchProject();
    fetchMyDevelopers();
  }, [projectId]);

  if (loading) return <p className="p-10">Loading project details...</p>;
  if (!project) return <p className="p-10 text-red-500">Project not found.</p>;

  return (
    <div className="p-10 max-w-4xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-gray-600 hover:text-blue-600 flex items-center gap-1 mb-4"
        >
          ← Back to Projects
        </button>

        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-[#2F3A4C]">{project.name}</h1>
          <button
            onClick={() => setShowEditModal(true)}
            className="text-sm text-blue-600 hover:underline flex items-center gap-1"
          >
            <span>✏️</span> Edit
          </button>
        </div>
        <p className="text-[#6B7280] mt-2">{project.description}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded shadow border border-[#B0B8C5]">
          <h3 className="text-sm font-medium text-[#2F3A4C]">Start Date</h3>
          <p>{project.start_date}</p>
        </div>
        <div className="bg-white p-4 rounded shadow border border-[#B0B8C5]">
          <h3 className="text-sm font-medium text-[#2F3A4C]">End Date</h3>
          <p>{project.end_date || "N/A"}</p>
        </div>
        <div className="bg-white p-4 rounded shadow border border-[#B0B8C5]">
          <h3 className="text-sm font-medium text-[#2F3A4C]">Status</h3>
          <p className="capitalize">{project.status}</p>
        </div>
        <div className="bg-white p-4 rounded shadow border border-[#B0B8C5]">
          <h3 className="text-sm font-medium text-[#2F3A4C]">Priority</h3>
          <p className="capitalize">{project.priority}</p>
        </div>
        <div className="bg-white p-4 rounded shadow border border-[#B0B8C5] col-span-1 md:col-span-2">
          <h3 className="text-sm font-medium text-[#2F3A4C]">Status</h3>
          <span
            className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-semibold ${
              project.is_active ? "bg-green-100 text-green-600" : "bg-gray-200 text-gray-500"
            }`}
          >
            {project.is_active ? "Active" : "Archived"}
          </span>
        </div>
      </div>

      {showEditModal && (
        <EditProjectModal
          project={project}
          onClose={() => setShowEditModal(false)}
          onUpdate={(updatedProject) => {
            setProject(updatedProject);
            setShowEditModal(false);
          }}
        />
      )}
      
      {showAssignModal && (
        <ManageMembersModal
          projectId={project.id}
          developers={myDevelopers}
          currentMembers={project.members || []}
          onClose={() => setShowAssignModal(false)}
          onSuccess={async () => {
            const res = await apiClient.get(`/api/projects/${projectId}/`);
            setProject(res.data);
            setShowAssignModal(false);
          }}
        />
      )}


      <div className="mt-10">
        <h2 className="text-xl font-semibold text-[#2F3A4C] mb-4">Team Members</h2>
          <button
            onClick={() => setShowAssignModal(true)}
            className="mb-4 px-4 py-2 bg-[#00C4B4] text-white rounded hover:bg-teal-600"
          >
             Edit Members
          </button>

        {/* Show existing members */}
        <ul className="space-y-2">
          {project.members?.map((member) => (
            <li key={member.id} className="text-sm text-[#2F3A4C]">
              👤 {member.full_name}
            </li>
          ))}
        </ul>
      </div>


      <div className="mt-10 text-sm text-gray-500">
        🔧 Tasks, Team, Kanban, and Reports sections coming soon.
      </div>
    </div>
  );
};

export default ProjectManagerProjectDetail;