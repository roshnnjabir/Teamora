const InfoModal = ({ open, title, message, onClose }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white w-full max-w-md rounded-lg shadow-lg p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-2">{title}</h2>
        <p className="text-sm text-gray-600 mb-4">{message}</p>
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="bg-[#00C4B4] hover:bg-teal-600 text-white px-4 py-2 rounded"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default InfoModal;