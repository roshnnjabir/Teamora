// components/ProjectDetail/LabelChip.jsx

const LabelChip = ({ label }) => {
  return (
    <span
      className="text-xs font-medium px-2 py-1 rounded-full shadow-sm"
      style={{
        backgroundColor: label.color || "#E5E8EC",
        color: "#fff",
      }}
      title={label.name}
    >
      {label.name}
    </span>
  );
};

export default LabelChip;