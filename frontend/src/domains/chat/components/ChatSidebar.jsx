// domains/chat/components/ChatSidebar.jsx
import ChatRoomItem from "./ChatRoomItem";

const ChatSidebar = ({ rooms, activeRoomId, currentUser, onSelectRoom, onOpenNewChat }) => {
  // Deduplicate rooms by ID
  const uniqueRooms = Object.values(
    rooms.reduce((acc, room) => {
      acc[room.id] = room; // override duplicates
      return acc;
    }, {})
  );

  // Sort rooms by last_message timestamp descending
  uniqueRooms.sort((a, b) => {
    const timeA = new Date(a.last_message?.timestamp || 0);
    const timeB = new Date(b.last_message?.timestamp || 0);
    return timeB - timeA;
  });

  return (
    <aside className="w-64 bg-white border-r border-[#E5E8EC] p-4 overflow-y-auto">
      <button
        onClick={onOpenNewChat}
        className="w-full bg-blue-600 text-white px-4 py-2 rounded mb-4 hover:bg-blue-700"
      >
        + New Chat
      </button>
      <h2 className="text-xl font-bold mb-4 text-[#1A2A44]">Your Chats</h2>
      <div className="space-y-2">
        {uniqueRooms.map((room) => (
          <ChatRoomItem
            key={room.id}
            room={room}
            isActive={room.id === activeRoomId}
            onClick={onSelectRoom}
            currentUser={currentUser}
            hasUnread={!!unreadRooms[room.id]}
          />
        ))}
      </div>
    </aside>
  );
};

export default ChatSidebar;