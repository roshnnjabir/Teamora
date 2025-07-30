import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const ConfirmToast = ({ message, onConfirm, onCancel }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  return createPortal(
    <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm">
      {/* Toast wrapper - pinned at top center */}
      <div className="absolute top-6 left-1/2 transform -translate-x-1/2">
        <div
          className={`
            transition-all duration-300 ease-out
            w-[90vw] max-w-md
            bg-[#F9FAFB] border border-[#B0B8C5] rounded-lg shadow-lg p-6
            ${visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}
          `}
        >
          <p className="text-[#1A2A44] text-base font-medium mb-4 text-center">
            {message}
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-[#1A2A44] border border-[#B0B8C5] rounded hover:bg-[#E5E8EC] transition"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 text-sm font-medium text-white bg-[#00C4B4] hover:bg-teal-600 rounded transition"
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ConfirmToast;