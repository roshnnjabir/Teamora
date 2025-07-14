import { Droppable } from "@hello-pangea/dnd";
import TaskCard from "./TaskCard";

const TaskColumn = ({ columnId, column }) => {
  return (
    <Droppable key={columnId} droppableId={columnId.toString()} isDropDisabled={column.isFormer}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className={`min-w-[320px] w-80 rounded-lg p-4 border-2 transition-colors
            ${column.isFormer ? 'bg-gray-100 border-gray-300 opacity-60 cursor-not-allowed' :
              snapshot.isDraggingOver ? 'border-[#00C4B4] bg-teal-50' : 'bg-[#F9FAFB] border-transparent'
            }
          `}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-semibold text-[#1A2A44]">{column.title}</h4>
              {column.subtitle && (
                <p className="text-sm text-[#6B7280]">{column.subtitle}</p>
              )}
            </div>
            <span className="bg-white text-[#6B7280] text-xs font-medium px-2 py-1 rounded-full">
              {column.tasks.length}
            </span>
          </div>
          
          <div className="space-y-3">
            {column.tasks.map((task, index) => (
              <TaskCard key={task.id} task={task} index={index} />
            ))}
            {provided.placeholder}
            
            {column.tasks.length === 0 && (
              <div className="text-center py-8 text-[#6B7280]">
                <div className="text-2xl mb-2">📝</div>
                <p className="text-sm">No tasks assigned</p>
              </div>
            )}
          </div>
        </div>
      )}
    </Droppable>
  );
};

export default TaskColumn;