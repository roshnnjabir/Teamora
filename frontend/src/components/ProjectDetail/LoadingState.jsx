// components/LoadingState.jsx
const LoadingState = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB]">
      <div className="flex items-center space-x-3">
        <div className="animate-spin h-8 w-8 rounded-full border-b-2 border-[#00C4B4]" />
        <span className="text-[#2F3A4C] font-medium">Loading project details...</span>
      </div>
    </div>
  );
};

export default LoadingState;