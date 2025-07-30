// domains/chat/components/MessageList.jsx
import React, { useEffect, useRef } from "react";
import { format } from "date-fns";

const MessageList = ({ messages, currentUser }) => {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 bg-[#F9FAFB]">
      {messages.map((msg) => {
        const isMine = msg.sender.id === currentUser.id;
        console.log("isMIne", currentUser.id, msg.sender);

        return (
          <div
            key={msg.id}
            className={`max-w-md p-3 rounded-lg shadow ${
              isMine
                ? "ml-auto bg-[#00C4B4] text-white"
                : "mr-auto bg-white border border-[#E5E8EC] text-[#1A2A44]"
            }`}
          >
            <div className="text-sm font-semibold mb-1">
              {msg.sender.full_name || "Unknown"}
            </div>
            <div className="text-sm">{msg.content}</div>
            <div className="text-xs text-gray-500 mt-1 text-right">
              {format(new Date(msg.timestamp), "p")}
            </div>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
};

export default MessageList;
