import { useEffect, useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import apiClient from "../../contexts/apiClient";
import { useDispatch } from "react-redux";
import { logoutUser } from "../../features/Auth/authThunks";

const statusOrder = ["todo", "in_progress", "done"];
const statusLabels = {
  todo: "To Do",
  in_progress: "In Progress",
  done: "Done",
};

const DeveloperDashboard = () => {
  const dispatch = useDispatch();
  const [tasksByStatus, setTasksByStatus] = useState({
    todo: [],
    in_progress: [],
    done: [],
  });
  const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
    try {
      const response = await apiClient.get("/api/my-tasks/");
      const grouped = { todo: [], in_progress: [], done: [] };
      response.data.forEach((task) => grouped[task.status].push(task));
      setTasksByStatus(grouped);
    } catch (err) {
      console.error("Failed to load tasks.", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;
    if (!destination || destination.droppableId === source.droppableId) return;

    const task = tasksByStatus[source.droppableId].find((t) => t.id.toString() === draggableId);
    const updatedTask = { ...task, status: destination.droppableId };

    try {
      await apiClient.patch(`/api/tasks/${task.id}/`, { status: destination.droppableId });
      fetchTasks();
    } catch (err) {
      console.error("Failed to update task.", err);
    }
  };

  const handleLogout = () => dispatch(logoutUser());

  return (
    <div className="flex min-h-screen bg-[#F9FAFB]">
      <aside className="w-64 bg-[#1A2A44] text-white p-6 space-y-6">
        <h2 className="text-2xl font-bold">Developer Panel</h2>
        <nav className="space-y-4">
          <a href="#" className="block hover:text-[#00C4B4]">Dashboard</a>
          <a href="#" className="block hover:text-[#00C4B4]">My Tasks</a>
        </nav>
        <button
          onClick={handleLogout}
          className="mt-auto w-full bg-[#00C4B4] hover:bg-teal-600 text-white py-2 rounded"
        >
          Logout
        </button>
      </aside>

      <main className="flex-1 p-10">
        <h1 className="text-3xl font-bold text-[#2F3A4C] mb-6">Developer Dashboard</h1>

        {loading ? (
          <p className="text-gray-500">Loading tasks...</p>
        ) : (
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {statusOrder.map((status) => (
                <Droppable droppableId={status} key={status}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="bg-white p-4 rounded-lg shadow min-h-[300px] border border-gray-200"
                    >
                      <h2 className="text-lg font-semibold mb-3 text-[#2F3A4C]">{statusLabels[status]}</h2>
                      {tasksByStatus[status].map((task, index) => (
                        <Draggable draggableId={task.id.toString()} index={index} key={task.id}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="bg-[#F9FAFB] mb-3 p-3 rounded border border-gray-300 shadow-sm hover:bg-[#F3F4F6]"
                            >
                              <h3 className="text-sm font-bold">{task.title}</h3>
                              <p className="text-xs text-gray-500 mb-1">📌 Project: {task.project?.name || "N/A"}</p>
                              <p className="text-xs text-gray-500">📅 Due: {task.due_date || "Not set"}</p>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              ))}
            </div>
          </DragDropContext>
        )}
      </main>
    </div>
  );
};

export default DeveloperDashboard;