// components/ProjectHeader.jsx
import { getStatusColor } from "../../../../utils/projectUtils";

const ProjectHeader = ({ project = {}, onBack, onEdit, isProjectActive }) => {
  const { name = "Untitled Project", status = "planning", description = "" } = project;

  return (
    <header className={`bg-white border-b border-[#E5E8EC] shadow-sm transition-opacity ${isProjectActive ? "opacity-100" : "opacity-60"}`}>
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Back Button */}
          <button
            onClick={onBack}
            className="flex items-center text-[#6B7280] hover:text-[#00C4B4] transition-colors"
            aria-label="Back to Projects"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="font-medium text-sm sm:text-base">Back to Projects</span>
          </button>

          {/* Edit Button */}
          <button
            onClick={onEdit}
            className="flex items-center space-x-2 bg-[#00C4B4] hover:bg-teal-600 text-white px-4 py-2 rounded-lg transition-colors"
            aria-label="Edit Project"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5
                m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            <span>Edit Project</span>
          </button>
        </div>

        {/* Project Title & Status */}
        <div className="mt-6">
          <div className="flex flex-wrap items-center space-x-4 mb-4">
            <h1 className="text-3xl font-bold text-[#1A2A44] truncate">{name}</h1>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusColor(
                status
              )}`}
            >
              {status}
            </span>
          </div>

          {/* Description */}
          {description ? (
            <p className="text-[#6B7280] text-lg max-w-3xl">{description}</p>
          ) : (
            <p className="text-[#9CA3AF] italic">No description provided for this project.</p>
          )}
        </div>
      </div>
    </header>
  );
};

export default ProjectHeader;