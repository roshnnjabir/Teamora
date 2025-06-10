import { getInitials } from "../../utils/projectUtils";

const TeamMembersSection = ({
  project = {},
  developers = [],
  onManageTeam,
  onRemoveMember,
  isProjectActive = false
}) => {
  const members = project.members || [];

  return (
    <section
      className={`bg-white rounded-xl shadow-sm border border-[#E5E8EC] p-6 transition-opacity ${
        isProjectActive ? "opacity-100" : "opacity-60 pointer-events-none"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-[#1A2A44] flex items-center space-x-2">
          <span role="img" aria-label="Team">👥</span>
          <span>Team Members</span>
          <span className="bg-[#F3F4F6] text-[#6B7280] text-sm px-2 py-1 rounded-full">
            {members.length}
          </span>
        </h2>

        <button
          onClick={isProjectActive ? onManageTeam : undefined}
          disabled={!isProjectActive}
          className={`px-4 py-2 rounded-lg transition flex items-center space-x-2 ${
            isProjectActive
              ? "bg-[#00C4B4] hover:bg-teal-600 text-white"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
          aria-label="Manage Team"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>Manage Team</span>
        </button>
      </div>

      {/* Members List */}
      {members.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((member) => {
            const dev = developers.find(d => d.id === member.employee.id);
            return (
              <div
                key={member.id}
                className="group relative flex items-center space-x-3 p-3 bg-[#F9FAFB] rounded-lg hover:bg-gray-100 transition"
              >
                <div
                  className="w-10 h-10 rounded-full bg-[#00C4B4] text-white text-sm font-medium flex items-center justify-center"
                  title={member.employee.full_name}
                >
                  {getInitials(member.employee.full_name)}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-[#1A2A44] truncate">{member.employee.full_name}</p>
                  <p className="text-sm text-[#6B7280] truncate">{member.employee.email}</p>
                  {dev && (
                    <p className="text-xs text-[#9CA3AF]">
                      Subtasks: {dev.assigned_subtasks_count || 0}
                    </p>
                  )}
                </div>

                {isProjectActive && (
                  <button
                    title="Remove Member"
                    onClick={() => onRemoveMember(member)}
                    className="absolute top-2 right-2 text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label={`Remove ${member.employee.full_name}`}
                  >
                    🗑️
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        // Empty State
        <div className="text-center py-8">
          <div className="text-4xl mb-4" role="img" aria-label="No members">👥</div>
          <p className="text-[#6B7280] mb-4">No team members assigned yet.</p>
          <button
            onClick={isProjectActive ? onManageTeam : undefined}
            disabled={!isProjectActive}
            className={`font-medium ${
              isProjectActive
                ? "text-[#00C4B4] hover:underline"
                : "text-gray-400 cursor-not-allowed"
            }`}
          >
            Add your first team member
          </button>
        </div>
      )}
    </section>
  );
};

export default TeamMembersSection;