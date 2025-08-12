// domains/chat/components/ChatRoomItem.jsx
import React from "react";

const ChatRoomItem = ({ room, isActive, onClick, currentUser }) => {
  let title = "";
  let subtitle = "";

  if (room.room_type === "PRIVATE" && currentUser) {
    const otherUser = room.participants.find(
      (user) => user.id !== currentUser.id
    );
    title = otherUser?.name || otherUser?.email || "Private Chat";
  } else if (room.room_type === "PROJECT") {
    title = room.project?.name || "Project Chat";
  }

  if (room.last_message) {
    const senderName = room.last_message.sender_name || "Unknown";
    subtitle = `${senderName}: ${room.last_message.content.slice(0, 30)}`;
  }

  return (
    <div
      className={`cursor-pointer p-3 rounded-md flex justify-between items-center ${
        isActive ? "bg-blue-100" : "hover:bg-gray-100"
      }`}
      onClick={() => onClick(room)}
    >
      <div>
        <div className="font-semibold">{title}</div>
        {subtitle && <div className="text-sm text-gray-500 truncate">{subtitle}</div>}
      </div>

      {hasUnread && (
        <span className="w-2 h-2 bg-red-500 rounded-full ml-2" />
      )}
    </div>
  );
};

export default ChatRoomItem;