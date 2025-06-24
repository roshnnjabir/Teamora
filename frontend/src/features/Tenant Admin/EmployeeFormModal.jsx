import { useState } from "react";
import { getInputClasses } from "../../styles/formClasses";

const roles = ["project_manager", "hr", "developer"];

export default function EmployeeFormModal({ onClose, onSave, initialData, error }) {
  const [formData, setFormData] = useState({
    full_name: initialData?.full_name || "",
    email: initialData?.email || "",
    confirm_email: "",
    password: "",
    job_title: initialData?.job_title || "",
    role: initialData?.role || "developer",
    department: initialData?.department || "",
  });

  const [emailError, setEmailError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (e.target.name === "confirm_email") {
      setEmailError(""); // Clear on input
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!initialData && formData.email !== formData.confirm_email) {
      setEmailError("Emails do not match.");
      return;
    }

    const dataToSend = { ...formData };
    if (initialData) {
      delete dataToSend.email;
      delete dataToSend.password;
    }
    delete dataToSend.confirm_email;

    dataToSend.role = dataToSend.role.toLowerCase();
    onSave(dataToSend);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1a2a44]/70 backdrop-blur-sm">
      <form
        onSubmit={handleSubmit}
        className="bg-white w-full max-w-lg rounded-2xl shadow-xl px-6 py-8 space-y-5 animate-fade-in"
      >
        <h2 className="text-2xl font-bold text-[#1A2A44] mb-2">
          {initialData ? "Edit Employee" : "Add New Employee"}
        </h2>

        <div className="grid grid-cols-1 gap-4">
          <input
            name="full_name"
            placeholder="Full Name"
            value={formData.full_name}
            onChange={handleChange}
            className={getInputClasses(!!error)}
            required
          />

          {!initialData && (
            <>
              <input
                name="email"
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                className={getInputClasses(!!error)}
                required
              />

              <input
                name="confirm_email"
                type="email"
                placeholder="Confirm Email"
                value={formData.confirm_email}
                onChange={handleChange}
                className={getInputClasses(!!error)}
                required
              />
              {emailError && (
                <p className="text-sm text-red-600">{emailError}</p>
              )}
            </>
          )}

          <input
            name="job_title"
            placeholder="Job Title"
            value={formData.job_title}
            onChange={handleChange}
            className={getInputClasses(!!error)}
            required
          />

          <select
            name="department"
            value={formData.department}
            onChange={handleChange}
            className={getInputClasses(!!error)}
            required
          >
            <option value="">Select Department</option>
            {[
              "Engineering",
              "Product",
              "Project Management",
              "Operations",
              "IT",
              "HR",
              "People Operations",
              "Talent Acquisition",
              "Learning & Development",
              "R&D",
              "DevOps",
              "Compliance"
            ].map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>

          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className={getInputClasses(!!error)}
          >
            {roles.map((r) => (
              <option key={r} value={r}>
                {r.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
              </option>
            ))}
          </select>
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-400 text-gray-700 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 rounded-lg bg-[#00C4B4] text-white font-semibold hover:bg-teal-600 transition"
          >
            {initialData ? "Update" : "Create"}
          </button>
        </div>
      </form>
    </div>
  );
}
