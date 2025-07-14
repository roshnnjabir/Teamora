import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import apiClient from "../../../../api/apiClient";
import { useSelector } from "react-redux";

const SubtaskDetailPage = () => {
  const { taskId, subtaskId } = useParams();
  const currentUser = useSelector((state) => state.auth?.user);

  const [subtask, setSubtask] = useState(null);
  const [taskTitle, setTaskTitle] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchSubtaskDetails = async () => {
    try {
      const res = await apiClient.get(`/api/tasks/${taskId}/`);
      const taskData = res.data;

      setTaskTitle(taskData.title);

      const found = taskData.subtasks?.find(
        (s) => String(s.id) === String(subtaskId)
      );

      if (!found) {
        setError("Subtask not found.");
      } else {
        setSubtask(found);
      }
    } catch (err) {
      setError("Failed to fetch subtask details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubtaskDetails();
  }, [taskId, subtaskId]);

  if (loading) return <p className="p-6 text-gray-600">Loading subtask...</p>;
  if (error) return <p className="text-red-500 p-6">{error}</p>;
  if (!subtask) return null;

  return (
    <div className="max-w-3xl mx-auto py-10 px-4 text-[#1A2A44]">
      <h1 className="text-2xl font-bold mb-2">Subtask: {subtask.title}</h1>
      <p className="text-sm text-gray-500 mb-4">
        Parent Task: <strong>{taskTitle}</strong>
      </p>

      <div className="bg-white p-5 rounded shadow">
        <p className="text-gray-700 mb-2">{subtask.description}</p>
        <p className="text-sm text-gray-500">
          Due Date: {subtask.due_date || "—"}
        </p>
        <p className="text-sm text-gray-500">
          Assigned to: {subtask.assigned_to?.full_name || "Unassigned"}
        </p>
      </div>
    </div>
  );
};

export default SubtaskDetailPage;