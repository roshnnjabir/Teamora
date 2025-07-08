// components/DeleteZone.jsx
import { Droppable } from "@hello-pangea/dnd";

const DeleteZone = ({ isDragging }) => {
  return (
    <Droppable droppableId="delete-zone">
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className={`
            mt-8 flex justify-center items-center h-32 rounded-lg border-2 border-dashed transition-all duration-300 ease-in-out
            ${isDragging ? 'opacity-100 transform scale-100' : 'opacity-0 transform scale-95 pointer-events-none'}
            ${snapshot.isDraggingOver ? 'bg-red-100 border-red-500 shadow-lg' : 'border-gray-300 bg-gray-50'}
          `}
        >
          <div className={`text-lg flex items-center space-x-2 transition-colors duration-200 ${
            snapshot.isDraggingOver ? 'text-red-700' : 'text-red-600'
          }`}>
            <span className="text-2xl">🗑️</span>
            <span className="font-medium">Drag here to delete task</span>
          </div>
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );
};

export default DeleteZone;