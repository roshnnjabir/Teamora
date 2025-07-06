// components/NotFoundState.jsx
const NotFoundState = ({ onBackToDashboard }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB]">
      <div className="text-center">
        <div className="text-6xl mb-4">🔍</div>
        <h2 className="text-2xl font-bold text-[#2F3A4C] mb-2">Project Not Found</h2>
        <p className="text-[#6B7280] mb-6">The project you're looking for doesn't exist or has been removed.</p>
        <button
          onClick={onBackToDashboard}
          className="bg-[#00C4B4] hover:bg-teal-600 text-white px-6 py-3 rounded-lg transition"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default NotFoundState;