// components/ProjectHeader.jsx
import { getStatusColor } from "../../utils/projectUtils";

const ProjectHeader = ({ project, onBack, onEdit }) => {
  return (
    <div className="bg-white border-b border-[#E5E8EC]">
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="flex items-center space-x-2 text-[#6B7280] hover:text-[#00C4B4] transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="font-medium">Back to Projects</span>
            </button>
          </div>
          <button
            onClick={onEdit}
            className="flex items-center space-x-2 bg-[#00C4B4] hover:bg-teal-600 text-white px-4 py-2 rounded-lg transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span>Edit Project</span>
          </button>
        </div>
        
        <div className="mt-6">
          <div className="flex items-center space-x-4 mb-4">
            <h1 className="text-3xl font-bold text-[#1A2A44]">{project.name}</h1>
            <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusColor(project.status)}`}>
              {project.status || 'planning'}
            </span>
          </div>
          <p className="text-[#6B7280] text-lg max-w-3xl">{project.description}</p>
        </div>
      </div>
    </div>
  );
};

export default ProjectHeader;