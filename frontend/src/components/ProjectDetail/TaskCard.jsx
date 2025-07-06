// components/TaskCard.jsx
import { Draggable } from "@hello-pangea/dnd";
import { getPriorityColor } from "../../../../utils/projectUtils";

const TaskCard = ({ task, index }) => {
  return (
    <Draggable
      key={task.id}
      draggableId={task.id.toString()}
      index={index}
    >
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`bg-white p-4 rounded-lg border shadow-sm cursor-grab active:cursor-grabbing transition-all duration-200 ${
            snapshot.isDragging ? 'shadow-xl ring-2 ring-[#00C4B4] ring-opacity-50 transform rotate-2 scale-105' : 'hover:shadow-md'
          }`}
        >
          <h5 className="font-medium text-[#1A2A44] mb-2">{task.title}</h5>
          {task.description && (
            <p className="text-sm text-[#6B7280] mb-3">{task.description}</p>
          )}
          {task.subtasks?.length > 0 && (
            <div className="mt-2 space-y-1">
              {task.subtasks.map((subtask) => (
                <div key={subtask.id} className="flex items-center space-x-2 text-sm text-[#374151]">
                  <input
                    type="checkbox"
                    checked={subtask.is_completed}
                    disabled
                    className="accent-[#00C4B4]"
                  />
                  <span className={subtask.is_completed ? "line-through text-gray-400" : ""}>
                    {subtask.title}
                  </span>
                </div>
              ))}
            </div>
          )}
          
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#6B7280]">
              {task.due_date ? `Due: ${task.due_date}` : 'No due date'}
            </span>
            {task.priority && (
              <span className={`font-medium ${getPriorityColor(task.priority)}`}>
                {task.priority.toUpperCase()}
              </span>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
};

export default TaskCard;