import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const Toast = ({ show, message, onClose, duration = 4000 }) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => onClose(), duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration, onClose]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50"
        >
          <div className="backdrop-blur-sm bg-white/80 border border-gray-300 shadow-lg px-4 py-2 rounded-lg text-sm text-gray-800">
            {message}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Toast;