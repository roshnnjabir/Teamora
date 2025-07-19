const ChatHeader = ({ room, currentUser }) => {
  let title = "Chat Room";

  if (room?.room_type === "PROJECT") {
    title = room?.project?.name || room?.name || "Project Chat";
  } else if (room?.room_type === "PRIVATE") {
    const otherUser = room?.participants?.find((p) => p.id !== currentUser.id);
    title = otherUser?.full_name || otherUser?.email || "Private Chat";
  } else {
    title = room?.name || "Chat Room";
  }

  return (
    <div className="px-6 py-4 border-b border-[#E5E8EC] bg-white">
      <h2 className="text-xl font-bold text-[#1A2A44]">{title}</h2>
      <p className="text-sm text-[#B0B8C5] capitalize">
        {room?.room_type === "PROJECT" ? "Project Chat Room" : "Private Chat"}
      </p>
    </div>
  );
};

export default ChatHeader;