import { Draggable } from "@hello-pangea/dnd";
import { getPriorityColor } from "../../utils/projectUtils";
import { useState } from "react";
import LabelChip from "./LabelChip";
import { Link } from "react-router-dom";
import CommentsModal from "./CommentsModal";
import EditTaskLabelsModal from "./EditTaskLabelsModal";
import { useSelector } from "react-redux";

const TaskCard = ({ task, index }) => {
  const [showComments, setShowComments] = useState(false);
  const [showLabelEditor, setShowLabelEditor] = useState(false);
  const userRole = useSelector((state) => state.auth?.profile?.role);

  return (
    <>
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
              snapshot.isDragging
                ? "shadow-xl ring-2 ring-[#00C4B4] ring-opacity-50 transform rotate-2 scale-105"
                : "hover:shadow-md"
            }`}
          >
            {/* Title */}
            <h5 className="font-medium text-[#1A2A44] mb-2">
              <Link to={`/project_manager/tasks/${task.id}`} className="hover:underline">
                {task.title}
              </Link>
            </h5>

            {/* Description */}
            {task.description && (
              <p className="text-sm text-[#6B7280] mb-3">{task.description}</p>
            )}


            {/* Labels */}
            {task.labels?.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {task.labels.map((label) => (
                  <span
                    key={label.id}
                    className="px-2 py-0.5 text-xs rounded-full font-medium"
                    style={{
                      backgroundColor: label.color + "20",
                      color: label.color,
                      border: `1px solid ${label.color}`,
                    }}
                  >
                    {label.name}
                  </span>
                ))}
              </div>
            )}

            {/* ✅ Subtasks */}
            {task.subtasks?.length > 0 && (
              <div className="mt-2 space-y-1">
                {task.subtasks.map((subtask) => (
                  <div
                    key={subtask.id}
                    className="flex items-center space-x-2 text-sm text-[#374151]"
                  >
                    <input
                      type="checkbox"
                      checked={subtask.is_completed}
                      disabled
                      className="accent-[#00C4B4]"
                    />
                    <span
                      className={
                        subtask.is_completed ? "line-through text-gray-400" : ""
                      }
                    >
                      {subtask.title}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Footer: Due date + Priority + Action buttons */}
            <div className="flex items-center justify-between mt-4 text-xs">
              <span className="text-[#6B7280]">
                {task.due_date ? `Due: ${task.due_date}` : "No due date"}
              </span>
              <div className="flex items-center space-x-2">
                {task.priority && (
                  <span className={`font-medium ${getPriorityColor(task.priority)}`}>
                    {task.priority.toUpperCase()}
                  </span>
                )}
                <button
                  onClick={() => setShowComments(true)}
                  className="text-[#6B7280] hover:text-[#1A2A44] transition"
                  title="View Comments"
                >
                  💬
                </button>
                {userRole === "project_manager" && (
                  <button
                    onClick={() => setShowLabelEditor(true)}
                    className="text-[#6B7280] hover:text-[#1A2A44] transition"
                    title="Edit Labels"
                  >
                    🏷️
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </Draggable>

      {/* Modals */}
      {showComments && (
        <CommentsModal
          taskId={task.id}
          onClose={() => setShowComments(false)}
        />
      )}
      {showLabelEditor && (
        <EditTaskLabelsModal
          task={task}
          onClose={() => setShowLabelEditor(false)}
        />
      )}
    </>
  );
};

export default TaskCard;