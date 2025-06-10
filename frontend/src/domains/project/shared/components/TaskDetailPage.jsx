import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import apiClient from "../../../../api/apiClient";
import CreateSubtaskModal from "./CreateSubtaskModal";

const TaskDetailPage = () => {
  const { taskId } = useParams();
  const id = parseInt(taskId, 10);

  const [task, setTask] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [showSubtaskModal, setShowSubtaskModal] = useState(false);

  const currentUser = useSelector((state) => state.auth?.user);

  const fetchTaskDetails = async () => {
    try {
      const res = await apiClient.get(`/api/tasks/${id}/`);
      setTask({
        ...res.data,
        comments: res.data.comments || [],
        subtasks: res.data.subtasks || [],
      });
    } catch (err) {
      setError("Failed to fetch task details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaskDetails();
  }, [id]);

  const handleCommentSubmit = async () => {
    if (!newComment.trim()) return;

    try {
      const res = await apiClient.post("/api/comments/", {
        content_type: "task",
        object_id: task.id,
        text: newComment,
      });

      setTask((prev) => ({
        ...prev,
        comments: [res.data, ...prev.comments],
      }));

      setNewComment("");
    } catch (err) {
      console.error("Comment submission failed:", err);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await apiClient.delete(`/api/comments/${commentId}/`);
      setTask((prev) => ({
        ...prev,
        comments: prev.comments.filter((c) => c.id !== commentId),
      }));
    } catch (err) {
      console.error("Failed to delete comment:", err);
    }
  };

  if (loading) return <p className="p-6 text-gray-600">Loading task...</p>;
  if (error) return <p className="text-red-500 p-6">{error}</p>;
  if (!task) return null;

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 text-[#1A2A44]">
      {/* Task Info */}
      <h1 className="text-3xl font-bold mb-2">{task.title}</h1>
      <p className="text-gray-600 mb-6">{task.description}</p>

      {/* Subtasks */}
      <section className="mb-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Subtasks</h2>
          <button
            onClick={() => setShowSubtaskModal(true)}
            className="bg-[#00C4B4] hover:bg-teal-600 text-white px-4 py-2 rounded transition"
          >
            + Add Subtask
          </button>
        </div>

        {task.subtasks.length === 0 ? (
          <p className="text-sm text-gray-500">No subtasks yet.</p>
        ) : (
          <div className="space-y-3">
            {task.subtasks.map((subtask) => (
              <div
                key={subtask.id}
                className="bg-white border rounded p-4 shadow-sm"
              >
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-[#1A2A44]">{subtask.title}</h3>
                  <span className="text-xs text-gray-500">
                    Due: {subtask.due_date || "—"}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{subtask.description}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Assigned to: {subtask.assigned_to?.full_name || "Unassigned"}
                </p>
              </div>
            ))}
          </div>
        )}

        {showSubtaskModal && (
          <CreateSubtaskModal
            taskId={task.id}
            projectId={task.project}
            onClose={() => setShowSubtaskModal(false)}
            onCreated={fetchTaskDetails}
          />
        )}
      </section>

      {/* Comments */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Comments</h2>

        <div className="space-y-3 mb-4">
          {task.comments.length === 0 ? (
            <p className="text-sm text-gray-500">No comments yet.</p>
          ) : (
            task.comments.map((comment) => (
              <div
                key={comment.id}
                className="border p-3 rounded bg-gray-50 flex justify-between"
              >
                <div>
                  <p className="text-sm text-gray-700">{comment.text}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    — {comment.author_name || "Unknown"} at{" "}
                    {new Date(comment.created_at).toLocaleString()}
                  </p>
                </div>
                {comment.author === currentUser?.employee?.id && (
                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    className="text-xs text-red-500 hover:underline"
                  >
                    Delete
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {/* New comment input */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            className="flex-1 border border-[#D1D5DB] rounded p-2"
          />
          <button
            onClick={handleCommentSubmit}
            className="bg-[#00C4B4] hover:bg-teal-600 text-white px-4 py-2 rounded"
          >
            Send
          </button>
        </div>
      </section>
    </div>
  );
};

export default TaskDetailPage;