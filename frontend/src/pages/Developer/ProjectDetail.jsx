import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import apiClient from "../../contexts/apiClient";

const DeveloperProjectDetail = () => {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const res = await apiClient.get(`/api/projects/${projectId}/`);
        setProject(res.data);
      } catch (error) {
        console.error("Error loading project", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [projectId]);

  if (loading) return <p>Loading project...</p>;
  if (!project) return <p>Project not found.</p>;

  return (
    <div className="p-10">
      <h1 className="text-2xl font-bold text-[#2F3A4C] mb-2">{project.name}</h1>
      <p className="text-[#6B7280] mb-6">{project.description}</p>

      <div className="bg-white p-4 rounded shadow border border-[#B0B8C5]">
        <h3 className="text-md font-semibold mb-2 text-[#2F3A4C]">Due Date</h3>
        <p>{project.end_date || "No deadline"}</p>
      </div>

      <section className="mt-8">
        <h2 className="text-xl font-semibold mb-2 text-[#2F3A4C]">My Tasks (Coming Soon)</h2>
        <p className="text-sm text-[#6B7280]">Here you’ll see tasks assigned to you for this project.</p>
      </section>
    </div>
  );
};

export default DeveloperProjectDetail;
