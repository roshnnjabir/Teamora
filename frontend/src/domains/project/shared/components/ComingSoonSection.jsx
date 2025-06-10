// components/ComingSoonSection.jsx
const ComingSoonSection = () => {
  return (
    <div className="bg-gradient-to-r from-[#00C4B4] to-teal-600 rounded-xl p-6 text-white">
      <div className="flex items-center space-x-3">
        <div className="text-3xl">🚀</div>
        <div>
          <h3 className="text-lg font-semibold">Coming Soon</h3>
          <p className="text-teal-100">Advanced Kanban boards, detailed reports, and time tracking features are on the way!</p>
        </div>
      </div>
    </div>
  );
};

export default ComingSoonSection;