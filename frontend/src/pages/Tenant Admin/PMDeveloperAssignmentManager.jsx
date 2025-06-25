import { useEffect, useState } from "react";
import apiClient from "../../contexts/apiClient";

const PMDeveloperAssignmentManager = () => {
  const [developers, setDevelopers] = useState([]);
  const [pms, setPms] = useState([]);
  const [selectedPM, setSelectedPM] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const empRes = await apiClient.get("/api/employees/");
        const all = empRes.data;
        setDevelopers(all.filter((e) => e.role === "developer"));
        setPms(all.filter((e) => e.role === "project_manager"));

        const assignmentRes = await apiClient.get("/api/pm-assignments/grouped/");
        setAssignments(assignmentRes.data);
      } catch (err) {
        console.error(err);
        setError("Failed to load data.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [success]);

  const handleAssign = async (developerId) => {
    if (!selectedPM) return;

    try {
      setAssigning(true);
      await apiClient.post("/api/pm-assignments/", {
        manager: selectedPM,
        developer: developerId,
      });
      setSuccess("Developer assigned successfully.");
      setError("");
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.detail || "Failed to assign developer.");
      setSuccess("");
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="mt-10 bg-white border rounded-lg p-6 shadow">
      <h3 className="text-xl font-semibold mb-6">Assign Developers to Project Managers</h3>

      {success && <p className="text-green-600">{success}</p>}
      {error && <p className="text-red-600">{error}</p>}

      {/* PM Select + Assign */}
      <div className="mb-6">
        <label className="block font-medium mb-2">Select Project Manager:</label>
        <select
          onChange={(e) => setSelectedPM(Number(e.target.value))}
          className="border px-4 py-2 rounded w-full"
          defaultValue=""
        >
          <option value="" disabled>Select a PM</option>
          {pms.map((pm) => (
            <option key={pm.id} value={pm.id}>
              {pm.full_name} ({pm.email})
            </option>
          ))}
        </select>
      </div>

      {/* Developer List */}
      {selectedPM && (
        <div className="mb-6">
          <h4 className="font-medium mb-2">Available Developers:</h4>
          <ul className="space-y-2">
            {developers.map((dev) => (
              <li key={dev.id} className="flex justify-between items-center border-b py-2">
                <span>{dev.full_name} ({dev.email})</span>
                <button
                  className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                  onClick={() => handleAssign(dev.id)}
                  disabled={assigning}
                >
                  Assign
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* PM -> Developer Mapping */}
      <div className="mt-10">
        <h4 className="text-lg font-semibold mb-4">Current Assignments:</h4>
        {assignments.length === 0 ? (
          <p>No assignments found.</p>
        ) : (
          assignments.map(({ manager, developers }) => (
            <div key={manager.id} className="mb-4 border rounded p-4 bg-gray-50">
              <h5 className="font-semibold text-[#1A2A44] mb-2">{manager.full_name} ({manager.email})</h5>
              {developers.length === 0 ? (
                <p className="text-sm text-gray-500">No developers assigned.</p>
              ) : (
                <ul className="list-disc pl-5 text-sm">
                  {developers.map((dev) => (
                    <li key={dev.id}>
                      {dev.full_name} ({dev.email})
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PMDeveloperAssignmentManager;
