import InlineEditField from "../../../../components/common/InlineEditField";
import { getPriorityColor } from "../../../../utils/projectUtils";

const ProjectOverview = ({ project = {}, isProjectActive = false, onFieldUpdate }) => {
  const {
    start_date = "",
    end_date = "",
    status = "planning",
    priority = "medium",
  } = project;

  const handleSave = (field) => (val) => {
    if (!isProjectActive) return; // Prevent save action
    onFieldUpdate(field, val);
  };

  return (
    <section
      className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 rounded-xl transition-opacity ${
        isProjectActive ? "opacity-100" : "opacity-60 pointer-events-none"
      }`}
    >
      <InlineEditField
        name="start_date"
        label="Start Date"
        value={start_date}
        type="date"
        icon="📅"
        // min={new Date().toISOString().split("T")[0]}
        onSave={handleSave("start_date")}
      />

      <InlineEditField
        name="end_date"
        label="End Date"
        value={end_date}
        type="date"
        icon="🏁"
        // min={new Date().toISOString().split("T")[0]}
        onSave={handleSave("end_date")}
      />

      <InlineEditField
        name="status"
        label="Status"
        value={status}
        type="select"
        options={["planning", "in_progress", "completed", "on_hold"]}
        icon="📊"
        onSave={handleSave("status")}
      />

      <InlineEditField
        name="priority"
        label="Priority"
        value={priority}
        type="select"
        options={["low", "medium", "high"]}
        icon="🔥"
        valueClassName={getPriorityColor(priority)}
        onSave={handleSave("priority")}
      />
    </section>
  );
};

export default ProjectOverview;