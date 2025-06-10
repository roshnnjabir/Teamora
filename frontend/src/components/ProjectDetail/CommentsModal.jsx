// components/ProjectDetail/CommentsModal.jsx

import { useEffect, useState } from "react";
import apiClient from "../../contexts/apiClient";

const CommentsModal = ({ taskId, onClose }) => {
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchComments = async () => {
    try {
      const res = await apiClient.get(`/api/comments/?content_type=task&object_id=${taskId}`);
      setComments(res.data.results);
    } catch (err) {
      console.error("Error fetching comments", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    try {
      const res = await apiClient.post(`/api/comments/`, {
        content_type: "task",
        object_id: taskId,
        text,
      });
      setComments((prev) => [...prev, res.data]);
      setText("");
    } catch (err) {
      console.error("Error posting comment", err);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [taskId]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg w-full max-w-md p-6 shadow-lg relative">
        <h2 className="text-lg font-semibold text-[#1A2A44] mb-4">💬 Comments</h2>

        <div className="max-h-64 overflow-y-auto space-y-3 mb-4">
          {loading ? (
            <p className="text-sm text-gray-500">Loading comments...</p>
          ) : comments.length === 0 ? (
            <p className="text-sm text-gray-500">No comments yet.</p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="bg-[#F9FAFB] p-2 rounded shadow-sm">
                <p className="text-sm text-[#1A2A44] font-medium">{comment.author_name}</p>
                <p className="text-sm text-gray-700">{comment.text}</p>
                <p className="text-xs text-gray-400">{new Date(comment.created_at).toLocaleString()}</p>
              </div>
            ))
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Add a comment..."
            rows={3}
            className="w-full border border-gray-300 rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C4B4]"
          />
          <div className="flex justify-between items-center">
            <button
              type="submit"
              className="bg-[#00C4B4] hover:bg-teal-600 text-white text-sm px-4 py-1.5 rounded"
            >
              Post
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-sm text-gray-500 hover:underline"
            >
              Close
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CommentsModal;