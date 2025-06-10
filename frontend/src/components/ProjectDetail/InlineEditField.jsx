import { useState, useEffect } from "react";

const InlineEditField = ({
  name,
  label,
  value,
  type = "text",
  options = [],
  onSave,
  icon,
  valueClassName = "",
}) => {
  const [errors, setErrors] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);
  const [isLoading, setIsLoading] = useState(false);

  // Keep tempValue in sync with value prop
  useEffect(() => {
    setTempValue(value);
  }, [value]);

  const handleCancel = () => {
    setTempValue(value);
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (tempValue !== value) {
      setIsLoading(true);
      setErrors({});

      try {
        const result = await onSave(tempValue);
        if (result && typeof result === "object" && Object.keys(result).length > 0) {
          setErrors(result);
          return;
        }
        setIsEditing(false);
      } catch (error) {
        console.error("Save failed:", error);
        setErrors({ general: ["Something went wrong."] });
      } finally {
        setIsLoading(false);
      }
    } else {
      setIsEditing(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && type !== "textarea") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCancel();
    }
  };

  const formatDisplayValue = (val) => {
    if (!val) return "—";
    if (type === "date") {
      return new Date(val).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    }
    return type === "select" ? val.replace(/_/g, " ") : val;
  };

  const renderInput = () => {
    const baseClass =
      "w-full border border-[#D1D5DB] rounded-lg px-4 py-3 text-[#1A2A44] focus:ring-2 focus:ring-[#00C4B4] focus:border-[#00C4B4] outline-none transition-colors";

    switch (type) {
      case "select":
        return (
        <>
          <select
            value={tempValue}
            onChange={(e) => {
              setTempValue(e.target.value);
              if (errors[name]) {
                setErrors((prev) => ({ ...prev, [name]: undefined }));
              }
            }}
            onKeyDown={handleKeyDown}
            className={baseClass}
            autoFocus
          >
            {options.map((opt) => (
              <option key={opt} value={opt}>
                {opt.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
              </option>
            ))}
          </select>
          {errors?.[name] && (
              <p className="text-sm text-red-500 mt-1">{errors[name][0]}</p>
            )}
        </>
        );
      case "textarea":
        return (
          <>
            <textarea
              value={tempValue}
              onChange={(e) => {
                setTempValue(e.target.value);
                if (errors[name]) {
                  setErrors((prev) => ({ ...prev, [name]: undefined }));
                }
              }}
              onKeyDown={handleKeyDown}
              className={`${baseClass} resize-none`}
              rows={3}
              autoFocus
            />
            {errors?.[name] && (
              <p className="text-sm text-red-500 mt-1">{errors[name][0]}</p>
            )}
          </>
        );
      default:
        return (
          <>
            <input
              type={type}
              value={tempValue}
              onChange={(e) => {
                setTempValue(e.target.value);
                if (errors[name]) {
                  setErrors((prev) => ({ ...prev, [name]: undefined }));
                }
              }}
              onKeyDown={handleKeyDown}
              className={baseClass}
              autoFocus
            />
            {errors?.[name] && (
              <p className="text-sm text-red-500 mt-1">{errors[name][0]}</p>
            )}
          </>
        );
    }
  };

  return (
    <div className="group relative">
      <div
        onClick={() => !isLoading && !isEditing && setIsEditing(true)}
        className={`bg-white rounded-xl border p-6 cursor-pointer transition-all duration-200 ${
          isEditing
            ? "ring-2 ring-[#00C4B4] ring-opacity-50 border-[#00C4B4]"
            : "border-[#E5E8EC] hover:shadow-md hover:border-[#00C4B4]"
        }`}
      >
        {/* Edit Icon */}
        {!isEditing && !isLoading && (
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <svg className="w-4 h-4 text-[#6B7280]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </div>
        )}

        {/* Loading spinner */}
        {isLoading && (
          <div className="absolute top-3 right-3">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#00C4B4]"></div>
          </div>
        )}

        {/* Label */}
        <div className="flex items-center space-x-2 mb-3">
          {icon && <span className="text-lg">{icon}</span>}
          <h3 className="text-sm font-semibold text-[#6B7280] uppercase tracking-wide">{label}</h3>
        </div>

        {/* Content or Input */}
        {isEditing ? (
          <div className="space-y-4">
            {renderInput()}

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-sm font-medium text-[#6B7280] hover:text-[#374151] flex items-center space-x-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>Cancel</span>
              </button>
              <button
                onClick={handleSave}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium bg-[#00C4B4] hover:bg-teal-600 text-white rounded-lg flex items-center space-x-1 disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                <span>{isLoading ? "Saving..." : "Save"}</span>
              </button>
            </div>
          </div>
        ) : (
          <div>
            <p className={`text-lg font-semibold capitalize ${valueClassName || "text-[#1A2A44]"}`}>
              {formatDisplayValue(value)}
            </p>
            {!value && <p className="text-sm text-[#9CA3AF] mt-1">Click to add {label.toLowerCase()}</p>}
          </div>
        )}
      </div>
    </div>
  );
};

export default InlineEditField;
