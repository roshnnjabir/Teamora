import { useEffect, useState } from "react";
import apiClient from "../../contexts/apiClient";
import {
  DragDropContext,
  Droppable,
  Draggable,
} from "@hello-pangea/dnd";

const PMDeveloperAssignmentManager = ({ onAssignmentChange, refreshTrigger }) => {
  const [columns, setColumns] = useState({});
  const [columnOrder, setColumnOrder] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const empRes = await apiClient.get("/api/employees/");
        const employees = empRes.data;

        const assignmentRes = await apiClient.get("/api/pm-assignments/grouped/");
        const assignments = assignmentRes.data;

        const columnsData = {};
        const order = [];

        assignments.forEach(({ manager, developers }) => {
          columnsData[manager.id] = {
            id: manager.id,
            title:
              manager.id === 0
                ? "Unassigned Developers"
                : `${manager.full_name} (${manager.email})`,
            developers,
          };
          order.push(manager.id);
        });

        // If unassigned column (id: 0) not in response, add it manually
        if (!columnsData[0]) {
          columnsData[0] = {
            id: 0,
            title: "Unassigned Developers",
            developers: [],
          };
          order.push(0); // add at the end
        }

        setColumns(columnsData);
        setColumnOrder(order);
      } catch (err) {
        console.error(err);
        setError("Failed to load data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [success, refreshTrigger]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(""), 1000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const handleDragEnd = async (result) => {
    const { source, destination, draggableId } = result;
    
    if (!destination || source.droppableId === destination.droppableId) return;
    
    const sourceCol = columns[source.droppableId];
    const destCol = columns[destination.droppableId];
    const dev = sourceCol.developers.find((d) => d.id.toString() === draggableId);
    
    const newSourceDevs = [...sourceCol.developers];
    newSourceDevs.splice(source.index, 1);
    const newDestDevs = [...destCol.developers];
    newDestDevs.splice(destination.index, 0, dev);
    
    const newCols = {
      ...columns,
      [source.droppableId]: { ...sourceCol, developers: newSourceDevs },
      [destination.droppableId]: { ...destCol, developers: newDestDevs },
    };
  
    setColumns(newCols);
  
    try {
      const managerId = Number(destination.droppableId);
    
      await apiClient.post("/api/pm-assignments/", {
        manager: managerId === 0 ? null : managerId,
        developer: Number(draggableId),
      });
    
      setSuccess("Developer reassigned.");
      setError("");
    
      if (typeof onAssignmentChange === "function") {
        onAssignmentChange();
      }
    } catch (err) {
      console.error(err);
      setError("Failed to reassign developer.");
      setSuccess("");
    }
  };


  if (loading) return <p>Loading...</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div className="mt-10">
      <h3 className="text-xl font-semibold mb-6">Reassign Developers by Drag and Drop</h3>

      {success && <p className="text-green-600">{success}</p>}
      {error && <p className="text-red-600">{error}</p>}

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex space-x-6 overflow-x-auto pb-4">
          {columnOrder.map((pmId) => {
            const column = columns[pmId];
            return (
              <Droppable droppableId={pmId.toString()} key={pmId}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="bg-gray-100 p-4 rounded shadow min-w-[250px] flex-shrink-0"
                  >
                    <h4 className="font-semibold mb-2">{column.title}</h4>
                    {column.developers.length === 0 ? (
                      <p className="text-sm text-gray-500">No developers</p>
                    ) : (
                      column.developers.map((dev, index) => (
                        <Draggable
                          draggableId={dev.id.toString()}
                          index={index}
                          key={dev.id}
                        >
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="bg-white p-2 mb-2 rounded border shadow-sm text-sm"
                            >
                              {dev.full_name} ({dev.email})
                            </div>
                          )}
                        </Draggable>
                      ))
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
};

export default PMDeveloperAssignmentManager;
