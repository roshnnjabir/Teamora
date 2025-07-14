import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import axios from "axios";

const SubtaskBlockToast = ({ developerId, blockingSubtasks = [], onClose, onNotified, onCancel }) => {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleNotify = async () => {
    setLoading(true);
    setErrorMsg("");

    try {
      await axios.post("/api/notify-pm/", {
        developer_id: developerId,
        subtask_ids: blockingSubtasks.map((s) => s.id),
      });

      if (onNotified) onNotified();
      onClose();
    } catch (err) {
      console.error("Failed to notify PM:", err);
      setErrorMsg("Failed to notify the project manager. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  return createPortal(
    <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm">
      <div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-[90vw] max-w-lg">
        <div
          className={`transition-all duration-300 ease-out bg-white border border-gray-300 rounded-lg shadow-lg p-6 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
          }`}
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold text-red-600">
              Developer cannot be reassigned
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-700 text-xl font-bold"
              aria-label="Close"
            >
              &times;
            </button>
          </div>

          {/* Info message */}
          <p className="text-sm text-gray-800 mb-2">
            This developer still has active subtasks in the following projects:
          </p>

          {/* Subtask list */}
          <div className="text-sm text-gray-700 max-h-60 overflow-auto border rounded p-2 bg-gray-50 mb-3">
            <ul className="list-disc pl-5 space-y-1">
              {blockingSubtasks.map((s) => (
                <li key={s.id}>
                  <strong>{s.title}</strong> — <em>{s.task__title}</em> ({s.task__project__name})
                </li>
              ))}
            </ul>
          </div>

          {/* Error message */}
          {errorMsg && <p className="text-sm text-red-600 mb-2">{errorMsg}</p>}

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-800 border border-gray-400 rounded hover:bg-gray-100"
              onClick={() => {
                onCancel?.();
                onClose();
              }}>
              Cancel
            </button>
            <button
              onClick={handleNotify}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded disabled:opacity-60"
            >
              {loading ? "Notifying..." : "Notify PM"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default SubtaskBlockToast;