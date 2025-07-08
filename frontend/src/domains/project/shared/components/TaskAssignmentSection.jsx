// components/TaskAssignmentSection.jsx
import { DragDropContext } from "@hello-pangea/dnd";
import ScrollContainer from "./ScrollContainer";
import TaskColumn from "./TaskColumn";
import DeleteZone from "./DeleteZone";

const TaskAssignmentSection = ({ 
  tasks, 
  columns, 
  columnOrder, 
  isDragging, 
  onCreateTask, 
  onDragStart, 
  onDragEnd 
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#E5E8EC] p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-[#1A2A44] flex items-center space-x-2">
          <span>📋</span>
          <span>Task Assignment</span>
          <span className="bg-[#F3F4F6] text-[#6B7280] text-sm px-2 py-1 rounded-full">
            {tasks.length}
          </span>
        </h2>
        <button
          onClick={onCreateTask}
          className="bg-[#00C4B4] hover:bg-teal-600 text-white px-4 py-2 rounded-lg transition flex items-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>New Task</span> 
        </button>
      </div>

      <DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <ScrollContainer>
          <div className="flex space-x-6 min-w-max">
            {columnOrder.map((colId) => (
              <TaskColumn 
                key={colId} 
                columnId={colId} 
                column={columns[colId]} 
              />
            ))}
          </div>
        </ScrollContainer>
        
        <DeleteZone isDragging={isDragging} />
      </DragDropContext>
    </div>
  );
};

export default TaskAssignmentSection;