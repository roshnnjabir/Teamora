import { Droppable, Draggable } from "@hello-pangea/dnd";
import { Link } from "react-router-dom";

const TaskColumn = ({ columnId, column }) => {
  return (
    <Droppable droppableId={columnId.toString()}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className="bg-gray-100 p-4 rounded shadow min-w-[280px] flex-shrink-0"
        >
          <h4 className="font-semibold mb-3 text-[#1A2A44]">{column.title}</h4>

          {column.items.length === 0 ? (
            <p className="text-sm text-gray-500 italic">No subtasks</p>
          ) : (
            column.items.map((subtask, index) => (
              <Draggable
                draggableId={subtask.id.toString()}
                index={index}
                key={subtask.id}
              >
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                      className="bg-white p-3 mb-3 rounded border border-gray-200 shadow-sm"
                    >
                    <a
                      href={`/project_manager/tasks/${subtask.parent_task?.id ?? subtask.id}`}
                      className="text-[#00C4B4] font-semibold text-sm hover:underline"
                    >
                      {subtask.title}
                    </a>

                    {subtask.parent_task?.title && (
                      <p className="text-xs text-gray-500 mt-1">
                        Parent Task:{" "}
                        <Link
                          to={`/project_manager/tasks/${subtask.parent_task?.id ?? subtask.id}`}
                          className="text-[#00C4B4] font-semibold text-sm hover:underline"
                        >
                          {subtask.parent_task.title}
                        </Link>
                      </p>
                    )}

                    {subtask.description && (
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                        {subtask.description}
                      </p>
                    )}

                    <div className="text-xs text-gray-500 mt-2 flex flex-col gap-1">
                      <div>
                        Status:{" "}
                        <span className="font-medium capitalize text-gray-700">
                          {subtask.status || "N/A"}
                        </span>
                      </div>
                      {subtask.priority && (
                        <div>
                          Priority:{" "}
                          <span className="font-medium capitalize text-gray-700">
                            {subtask.priority}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="text-xs text-gray-500">
                      Due Date <strong>{new Date(subtask.due_date).toLocaleDateString() || "N/A"}</strong>
                    </div>

                    {/* Labels */}
                    {subtask.labels && subtask.labels.length > 0 && (
                      <div className="flex flex-wrap mt-2 gap-1">
                        {subtask.labels.map((label) => (
                          <span
                            key={label.id}
                            className="text-xs font-medium px-2 py-1 rounded-full mr-2 mb-2"
                            style={{ backgroundColor: label.color, color: "#fff" }}
                          >
                            {label.name}
                          </span>
                        ))}
                      </div>
                    )}
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
};

export default TaskColumn;