// components/TeamMembersSection.jsx
import { getInitials } from "../../../../utils/projectUtils";

const TeamMembersSection = ({ project, onManageTeam, onRemoveMember }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#E5E8EC] p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-[#1A2A44] flex items-center space-x-2">
          <span>👥</span>
          <span>Team Members</span>
          <span className="bg-[#F3F4F6] text-[#6B7280] text-sm px-2 py-1 rounded-full">
            {project.members?.length || 0}
          </span>
        </h2>
        <button
          onClick={onManageTeam}
          className="bg-[#00C4B4] hover:bg-teal-600 text-white px-4 py-2 rounded-lg transition flex items-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>Manage Team</span>
        </button>
      </div>
      
      {project.members?.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {project.members.map((member) => (
            <div key={member.id} className="group relative flex items-center space-x-3 p-3 bg-[#F9FAFB] rounded-lg hover:bg-gray-100 transition">
              <div className="w-10 h-10 rounded-full bg-[#00C4B4] text-white text-sm font-medium flex items-center justify-center">
                {getInitials(member.employee.full_name)}
              </div>
              <div>
                <p className="font-medium text-[#1A2A44]">{member.employee.full_name}</p>
                <p className="text-sm text-[#6B7280]">{member.employee.email}</p>
              </div>
              <button
                title="Remove Member"
                onClick={() => onRemoveMember(member)}
                className="absolute top-2 right-2 hidden group-hover:block text-red-500 hover:text-red-700"
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">👥</div>
          <p className="text-[#6B7280] mb-4">No team members assigned yet</p>
          <button
            onClick={onManageTeam}
            className="text-[#00C4B4] hover:underline font-medium"
          >
            Add your first team member
          </button>
        </div>
      )}
    </div>
  );
};

export default TeamMembersSection;