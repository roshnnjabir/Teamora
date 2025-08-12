import { motion, AnimatePresence } from "framer-motion";

const InfoModal = ({ open, title, message, onClose }) => {
  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md"
        >
          <div className="backdrop-blur-md bg-white/80 border border-gray-300 shadow-lg rounded-lg p-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-1">{title}</h2>
            <p className="text-sm text-gray-600">{message}</p>
            <div className="flex justify-end mt-2">
              <button
                onClick={onClose}
                className="bg-[#00C4B4] hover:bg-teal-600 text-white px-3 py-1 rounded"
              >
                OK
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default InfoModal;