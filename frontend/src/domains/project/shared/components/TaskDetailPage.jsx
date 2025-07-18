import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import apiClient from "../../../../api/apiClient";
import CreateSubtaskModal from "./CreateSubtaskModal";
import EditSubtaskModal from "./EditSubtaskModal";
import EditTaskModal from "./EditTaskModal"; // ✅ New

const TaskDetailPage = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const id = parseInt(taskId, 10);

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [newComment, setNewComment] = useState("");
  const currentUser = useSelector((state) => state.auth?.user);

  const [showCreateSubtask, setShowCreateSubtask] = useState(false);
  const [editingSubtask, setEditingSubtask] = useState(null);
  const [showEditTask, setShowEditTask] = useState(false);

  const fetchTask = async () => {
    try {
      const res = await apiClient.get(`/api/tasks/${id}/`);
      setTask({
        ...res.data,
        comments: res.data.comments || [],
        subtasks: res.data.subtasks || [],
      });
    } catch {
      setError("Failed to load task.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTask();
  }, [id]);

  if (loading) return <p className="p-6 text-[#2F3A4C]">Loading task...</p>;
  if (error) return <p className="p-6 text-[#EF4444]">{error}</p>;
  if (!task) return null;

  return (
    <div className="max-w-3xl mx-auto p-6 bg-[#F9FAFB] rounded-lg shadow-sm">
      {/* Navigation */}
      <button
        onClick={() => navigate(`/project_manager/projects/${task.project}`)}
        className="mb-4 flex items-center text-[#6B7280] hover:text-[#00C4B4] transition"
      >
        ← Back to Project
      </button>

      {/* Task Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2A44]">{task.title}</h1>
          <p className="text-[#6B7280]">{task.description}</p>
        </div>
        <button
          onClick={() => setShowEditTask(true)}
          className="text-sm text-[#00C4B4] hover:text-[#005f53]"
        >
          Edit Task ✏️
        </button>
      </div>

      {/* Subtasks Section */}
      <section className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold text-[#2F3A4C]">Subtasks</h2>
          <button
            onClick={() => setShowCreateSubtask(true)}
            className="text-sm bg-[#00C4B4] hover:bg-[#005f53] text-white px-3 py-1 rounded"
          >
            + Add Subtask
          </button>
        </div>
        {task.subtasks.length === 0 ? (
          <p className="text-[#B0B8C5] italic">No subtasks yet.</p>
        ) : (
          <ul className="space-y-3">
            {task.subtasks.map((st) => (
              <li
                key={st.id}
                className="flex justify-between p-4 bg-white border border-[#E5E8EC] rounded"
              >
                <div>
                  <p className="font-medium text-[#1A2A44]">{st.title}</p>
                  <p className="text-sm text-[#6B7280]">{st.description}</p>
                  <p className="text-xs text-[#B0B8C5] mt-1">
                    Due: {st.due_date || "—"}
                  </p>
                </div>
                <div className="flex flex-col items-end">
                  <button
                    onClick={() => setEditingSubtask(st)}
                    className="text-xs text-[#00C4B4] hover:underline mb-2"
                  >
                    Edit
                  </button>
                  <span className="text-xs text-[#6B7280]">
                    {st.assigned_to?.full_name || "Unassigned"}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Comments */}
      <section>
        <h2 className="text-lg font-semibold text-[#2F3A4C] mb-2">Comments</h2>
        <ul className="space-y-2 mb-4">
          {task.comments.map((c) => (
            <li
              key={c.id}
              className="p-3 bg-white border border-[#E5E8EC] rounded flex justify-between"
            >
              <div>
                <p className="text-[#2F3A4C]">{c.text}</p>
                <p className="text-xs text-[#B0B8C5] mt-1">
                  — {c.author_name} at{" "}
                  {new Date(c.created_at).toLocaleString()}
                </p>
              </div>
              {c.author === currentUser?.employee?.id && (
                <button
                  onClick={() => {
                    apiClient.delete(`/api/comments/${c.id}/`);
                    setTask((t) => ({
                      ...t,
                      comments: t.comments.filter((x) => x.id !== c.id),
                    }));
                  }}
                  className="text-xs text-[#EF4444] hover:underline"
                >
                  Delete
                </button>
              )}
            </li>
          ))}
        </ul>
        <div className="flex gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            className="flex-1 px-3 py-2 border border-[#E5E8EC] rounded"
          />
          <button
            onClick={async () => {
              if (!newComment.trim()) return;
              const res = await apiClient.post("/api/comments/", {
                content_type: "task",
                object_id: task.id,
                text: newComment,
              });
              setTask((t) => ({
                ...t,
                comments: [res.data, ...t.comments],
              }));
              setNewComment("");
            }}
            className="px-4 py-2 bg-[#00C4B4] hover:bg-[#005f53] text-white rounded"
          >
            Send
          </button>
        </div>
      </section>

      {/* Modals */}
      {showCreateSubtask && (
        <CreateSubtaskModal
          taskId={task.id}
          projectId={task.project}
          onClose={() => setShowCreateSubtask(false)}
          onCreated={fetchTask}
        />
      )}
      {editingSubtask && (
        <EditSubtaskModal
          subtask={editingSubtask}
          projectId={task.project}
          onClose={() => setEditingSubtask(null)}
          onUpdated={fetchTask}
        />
      )}
      {showEditTask && (
        <EditTaskModal
          task={task}
          onClose={() => setShowEditTask(false)}
          onUpdated={fetchTask}
        />
      )}
    </div>
  );
};

export default TaskDetailPage;