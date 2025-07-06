// components/ProjectOverview.jsx
import InlineEditField from "./InlineEditField";
import { getPriorityColor } from "../../utils/projectUtils";

const ProjectOverview = ({ project, onFieldUpdate }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <InlineEditField
        name="start_date"
        label="Start Date"
        value={project.start_date}
        type="date"
        onSave={(val) => onFieldUpdate("start_date", val)}
        icon="📅"
      />
      <InlineEditField
        name="end_date"
        label="End Date"
        value={project.end_date || ""}
        type="date"
        onSave={(val) => onFieldUpdate("end_date", val)}
        icon="🏁"
      />
      <InlineEditField
        name="status"
        label="Status"
        value={project.status}
        type="select"
        options={["planning", "in_progress", "completed", "on_hold"]}
        onSave={(val) => onFieldUpdate("status", val)}
        icon="📊"
      />
      <InlineEditField
        name="priority"
        label="Priority"
        value={project.priority}
        type="select"
        options={["low", "medium", "high"]}
        onSave={(val) => onFieldUpdate("priority", val)}
        icon="🔥"
        valueClassName={getPriorityColor(project.priority)}
      />
    </div>
  );
};

export default ProjectOverview;