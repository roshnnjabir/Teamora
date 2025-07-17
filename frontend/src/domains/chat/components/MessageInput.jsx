import React, { useState } from "react";

const MessageInput = ({ onSend, disabled }) => {
  const [message, setMessage] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() === "" || disabled) return;
    onSend(message);
    setMessage("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex p-4 border-t border-[#E5E8EC] bg-white"
    >
      <input
        type="text"
        placeholder={
          disabled ? "Chat is disabled for this room" : "Type a message..."
        }
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className="flex-1 border border-[#B0B8C5] rounded-lg px-4 py-2 mr-2 text-[#1A2A44]"
        disabled={disabled}
      />
      <button
        type="submit"
        className={`px-4 py-2 rounded text-white ${
          disabled
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-[#00C4B4] hover:bg-teal-600"
        }`}
        disabled={disabled}
      >
        Send
      </button>
    </form>
  );
};

export default MessageInput;