import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import apiClient from "../../contexts/apiClient";

const ProjectManagerProjectDetail = () => {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

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

    fetchProject();
  }, [projectId]);

  if (loading) return <p>Loading project details...</p>;
  if (!project) return <p>Project not found.</p>;

  return (
    <div className="p-10">
      <h1 className="text-3xl font-bold text-[#2F3A4C] mb-2">{project.name}</h1>
      <p className="text-[#6B7280] mb-4">{project.description}</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <div className="bg-white p-4 rounded shadow border border-[#B0B8C5]">
          <h3 className="text-md font-semibold text-[#2F3A4C]">Start Date</h3>
          <p>{project.start_date}</p>
        </div>
        <div className="bg-white p-4 rounded shadow border border-[#B0B8C5]">
          <h3 className="text-md font-semibold text-[#2F3A4C]">End Date</h3>
          <p>{project.end_date || "N/A"}</p>
        </div>
      </div>
      {/* Placeholder for tasks, members, charts etc */}
      <div className="mt-10 text-sm text-gray-500">🔧 Tasks, Team, Reports section coming soon.</div>
    </div>
  );
};

export default ProjectManagerProjectDetail;
