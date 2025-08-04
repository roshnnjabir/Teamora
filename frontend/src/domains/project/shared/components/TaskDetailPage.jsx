import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import apiClient from "../../../../api/apiClient";
import CreateSubtaskModal from "./CreateSubtaskModal";
import EditSubtaskModal from "./EditSubtaskModal";
import EditTaskModal from "./EditTaskModal";

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

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'text-[#EF4444] bg-[#FEF2F2] border-[#FECACA]';
      case 'medium': return 'text-[#FBBF24] bg-[#FFFBEB] border-[#FED7AA]';
      case 'low': return 'text-[#34D399] bg-[#ECFDF5] border-[#A7F3D0]';
      default: return 'text-[#B0B8C5] bg-[#F9FAFB] border-[#E5E8EC]';
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'done':
      case 'completed': return 'text-[#34D399] bg-[#ECFDF5] border-[#A7F3D0]';
      case 'in_progress': return 'text-[#50C6E9] bg-[#F0F9FF] border-[#BAE6FD]';
      case 'todo':
      case 'pending': return 'text-[#FBBF24] bg-[#FFFBEB] border-[#FED7AA]';
      default: return 'text-[#B0B8C5] bg-[#F9FAFB] border-[#E5E8EC]';
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-[#00C4B4] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-[#2F3A4C] font-medium">Loading task...</p>
      </div>
    </div>
  );
  
  if (error) return (
    <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-[#E5E8EC] text-center">
        <div className="w-12 h-12 bg-[#FEF2F2] rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-[#EF4444] text-xl">⚠️</span>
        </div>
        <p className="text-[#EF4444] font-medium">{error}</p>
      </div>
    </div>
  );
  
  if (!task) return null;

  return (
    <div className="min-h-screen bg-[#F9FAFB] py-8">
      <div className="max-w-4xl mx-auto px-6">
        {/* Navigation */}
        <button
          onClick={() => navigate(`/project_manager/projects/${task.project}`)}
          className="mb-6 inline-flex items-center gap-2 text-[#B0B8C5] hover:text-[#00C4B4] transition-colors duration-200 font-medium"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Project
        </button>

        {/* Main Content Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#E5E8EC] overflow-hidden">
          {/* Task Header */}
          <div className="p-8 border-b border-[#E5E8EC]">
            <div className="flex justify-between items-start mb-6">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-[#1A2A44] mb-3">{task.title}</h1>
                <p className="text-[#2F3A4C] text-lg leading-relaxed mb-4">{task.description}</p>
              </div>
              <button
                onClick={() => setShowEditTask(true)}
                className="ml-6 inline-flex items-center gap-2 px-4 py-2 bg-[#E5E8EC] hover:bg-[#B0B8C5] text-[#2F3A4C] rounded-lg transition-colors duration-200 font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Task
              </button>
            </div>

            {/* Task Metadata */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-[#F9FAFB] p-4 rounded-xl">
                <p className="text-[#B0B8C5] text-sm font-medium mb-1">Status</p>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(task.status)}`}>
                  {task.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>
              <div className="bg-[#F9FAFB] p-4 rounded-xl">
                <p className="text-[#B0B8C5] text-sm font-medium mb-1">Priority</p>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getPriorityColor(task.priority)}`}>
                  {task.priority?.toUpperCase() || 'NOT SET'}
                </span>
              </div>
              <div className="bg-[#F9FAFB] p-4 rounded-xl">
                <p className="text-[#B0B8C5] text-sm font-medium mb-1">Due Date</p>
                <p className="text-[#2F3A4C] font-medium">
                  {task.due_date ? new Date(task.due_date).toLocaleDateString() : "Not set"}
                </p>
              </div>
              <div className="bg-[#F9FAFB] p-4 rounded-xl">
                <p className="text-[#B0B8C5] text-sm font-medium mb-1">Created</p>
                <p className="text-[#2F3A4C] font-medium">
                  {new Date(task.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Labels */}
            <div>
              <p className="text-[#B0B8C5] text-sm font-medium mb-3">Labels</p>
              <div className="flex flex-wrap gap-2">
                {task.labels && task.labels.length > 0 ? (
                  task.labels.map((label) => (
                    <span
                      key={label.id}
                      className="px-4 py-2 text-sm font-medium rounded-full text-white shadow-sm"
                      style={{ backgroundColor: label.color }}
                    >
                      {label.name}
                    </span>
                  ))
                ) : (
                  <span className="text-[#B0B8C5] italic">No labels assigned</span>
                )}
              </div>
            </div>
          </div>

          {/* Subtasks Section */}
          <div className="p-8 border-b border-[#E5E8EC]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-[#1A2A44]">Subtasks</h2>
              <button
                onClick={() => setShowCreateSubtask(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#00C4B4] hover:bg-[#00a89c] text-white rounded-lg transition-colors duration-200 font-medium shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Subtask
              </button>
            </div>
            
            {task.subtasks.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-[#F9FAFB] rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-[#B0B8C5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p className="text-[#B0B8C5] font-medium">No subtasks yet</p>
                <p className="text-[#B0B8C5] text-sm mt-1">Break down this task into smaller, manageable pieces</p>
              </div>
            ) : (
              <div className="space-y-4">
                {task.subtasks.map((st) => (
                  <div
                    key={st.id}
                    className="bg-[#F9FAFB] border border-[#E5E8EC] rounded-xl p-6 hover:shadow-sm transition-shadow duration-200"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-[#1A2A44]">{st.title}</h3>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(st.status)}`}>
                            {st.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                        <p className="text-[#2F3A4C] mb-3 leading-relaxed">{st.description}</p>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-[#B0B8C5]">
                            Due: <span className="text-[#2F3A4C] font-medium">
                              {st.due_date ? new Date(st.due_date).toLocaleDateString() : "Not set"}
                            </span>
                          </span>
                          <span className="text-[#B0B8C5]">
                            Assigned: <span className="text-[#2F3A4C] font-medium">{st.assigned_to?.full_name || "Unassigned"}</span>
                          </span>
                          {st.estimated_hours && (
                            <span className="text-[#B0B8C5]">
                              Est. Hours: <span className="text-[#2F3A4C] font-medium">{st.estimated_hours}</span>
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => setEditingSubtask(st)}
                        className="ml-4 px-3 py-1 text-[#00C4B4] hover:bg-[#00C4B4] hover:text-white rounded-lg transition-colors duration-200 text-sm font-medium"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Comments Section */}
          <div className="p-8">
            <h2 className="text-2xl font-bold text-[#1A2A44] mb-6">Comments</h2>
            
            {/* Add Comment */}
            <div className="mb-8">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                  className="flex-1 px-4 py-3 border border-[#E5E8EC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00C4B4] focus:border-transparent transition-colors duration-200"
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
                  className="px-6 py-3 bg-[#00C4B4] hover:bg-[#00a89c] text-white rounded-xl transition-colors duration-200 font-medium shadow-sm"
                >
                  Send
                </button>
              </div>
            </div>

            {/* Comments List */}
            {task.comments.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-[#F9FAFB] rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-[#B0B8C5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p className="text-[#B0B8C5] font-medium">No comments yet</p>
                <p className="text-[#B0B8C5] text-sm mt-1">Start the conversation</p>
              </div>
            ) : (
              <div className="space-y-4">
                {task.comments.map((c) => (
                  <div
                    key={c.id}
                    className="bg-[#F9FAFB] border border-[#E5E8EC] rounded-xl p-6"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-[#2F3A4C] leading-relaxed mb-3">{c.text}</p>
                        <div className="text-sm text-[#B0B8C5]">
                          <span className="font-medium text-[#2F3A4C]">{c.author_name}</span>
                          <span className="mx-2">•</span>
                          <span>{new Date(c.created_at).toLocaleString()}</span>
                        </div>
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
                          className="ml-4 px-3 py-1 text-[#EF4444] hover:bg-[#FEF2F2] rounded-lg transition-colors duration-200 text-sm font-medium"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

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