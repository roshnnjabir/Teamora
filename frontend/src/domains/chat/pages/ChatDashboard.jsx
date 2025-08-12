import React, { useEffect, useRef, useState } from "react";
import ChatSidebar from "../components/ChatSidebar";
import ChatHeader from "../components/ChatHeader";
import MessageList from "../components/MessageList";
import MessageInput from "../components/MessageInput";
import apiClient from "../../../api/apiClient";
import { useSelector } from "react-redux";
import { createWebSocket } from "../../../utils/wsClient";
import UserListModal from "../components/UserListModal";

const ChatDashboard = () => {
  const currentUser = useSelector((state) => state.auth.user);
  const [chatRooms, setChatRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [showUserList, setShowUserList] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const socketRef = useRef(null);
  const prevRoomIdRef = useRef(null);
  const shouldReconnect = useRef(true);

  const [unreadRooms, setUnreadRooms] = useState({}); // { roomId: true } if room has unread messages

  const optimisticMessagesRef = useRef({}); // { tempId: true }

  useEffect(() => {
    fetchChatRooms();
  }, []);

  const fetchChatRooms = async () => {
    try {
      setLoadingRooms(true);
      const res = await apiClient.get("/api/chat-rooms/");
      setChatRooms(res.data || []);
      if (res.data.length > 0) setActiveRoom(res.data[0]);
    } finally {
      setLoadingRooms(false);
    }
  };

  const fetchMessages = async (roomId) => {
    try {
      setLoadingMessages(true);
      const res = await apiClient.get(`/api/chat-rooms/${roomId}/messages/`);
      const normalized = res.data.map((msg) => ({
        ...msg,
        sender: {
          id: msg.sender,
          full_name: msg.sender_name || "Unknown",
        },
      }))
      .reverse();
      setMessages(normalized);
      optimisticMessagesRef.current = {};
    } finally {
      setLoadingMessages(false);
    }
  };

  const connectWebSocket = (roomId) => {
    if (socketRef.current) {
      shouldReconnect.current = false;
      socketRef.current.close();
    }

    shouldReconnect.current = true;
    socketRef.current = createWebSocket(`/ws/chat/${roomId}/`);

    socketRef.current.onopen = () => {
      console.log("WebSocket connected");
    };

    socketRef.current.onmessage = (e) => {
      const data = JSON.parse(e.data);
    
      if (data.type === "seen") {
        console.log("Message seen:", data.message_id);
        return;
      }
    
      const newMessage = {
        id: data.id,
        content: data.message,
        sender: {
          id: data.sender_id,
          full_name: data.sender_name || "Someone",
        },
        timestamp: data.timestamp || new Date().toISOString(),
      };
    
      // Handle optimistic messages
      if (data.temp_id && optimisticMessagesRef.current[data.temp_id]) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === data.temp_id || (msg.optimistic && msg.content === data.message)
              ? newMessage
              : msg
          )
        );
        delete optimisticMessagesRef.current[data.temp_id];
      } else {
        setMessages((prev) => [...prev, newMessage]);
      }
    
      // Update last_message in chatRooms
      const senderName =
        data.sender_name ||
        chatRooms
          .flatMap((r) => r.participants || [])
          .find((u) => u.id === data.sender_id)?.full_name ||
        "Unknown";
    
      setChatRooms((prevRooms) =>
        prevRooms.map((room) => {
          const updatedRoom = room.id === activeRoom.id
            ? {
                ...room,
                last_message: {
                  id: data.id,
                  content: data.message,
                  sender_id: data.sender_id,
                  sender_name: senderName,
                  timestamp: data.timestamp || new Date().toISOString(),
                },
              }
            : room;
            
          return updatedRoom;
        })
      );
    
      if (data.room_id && data.room_id !== activeRoom?.id) {
        setUnreadRooms((prev) => ({ ...prev, [data.room_id]: true }));
      }
    };


    socketRef.current.onclose = (e) => {
      console.log("WebSocket closed. Code:", e.code, "Reason:", e.reason);

      if (shouldReconnect.current && e.code !== 1000) {
        console.log("Reconnecting in 3 seconds...");
        setTimeout(() => connectWebSocket(roomId), 3000);
      }
    };

    socketRef.current.onerror = (err) => {
      console.error("WebSocket error", err);
    };
  };

  const handleRoomSelect = (room) => {
    setActiveRoom(room);

    setUnreadRooms((prev) => {
      const copy = { ...prev };
      delete copy[room.id];
      return copy;
    });
  };

  const handleSendMessage = (text) => {
    if (!activeRoom || !socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      alert("WebSocket not connected.");
      return;
    }

    const tempId = `temp-${Date.now()}`;
    const optimisticMessage = {
      id: tempId,
      sender: { id: currentUser.id, full_name: currentUser.name || currentUser.email },
      content: text,
      timestamp: new Date().toISOString(),
      optimistic: true,
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    optimisticMessagesRef.current[tempId] = true;

    socketRef.current.send(JSON.stringify({ message: text, temp_id: tempId }));
  };

  useEffect(() => {
    if (!activeRoom?.id) return;
  
    if (prevRoomIdRef.current !== activeRoom.id) {
      prevRoomIdRef.current = activeRoom.id;

      fetchMessages(activeRoom.id);
      connectWebSocket(activeRoom.id);
    }

    return () => {
      if (socketRef.current) {
        console.log("Cleaning up WebSocket...");
        shouldReconnect.current = false;
        socketRef.current.close();
      }
    };
  }, [activeRoom?.id]);

  useEffect(() => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return;
    if (messages.length === 0) return;

    const lastMsg = messages[messages.length - 1];
    if (lastMsg?.sender?.id !== currentUser.id) {
      socketRef.current.send(JSON.stringify({ type: "seen", message_id: lastMsg.id }));
    }
  }, [messages]);

  if (!currentUser) {
    return (
      <div className="flex h-screen items-center justify-center text-gray-500">
        Loading user...
      </div>
    );
  }
  const isProjectRoom = activeRoom?.room_type === "PROJECT";
  const isPrivateRoom = activeRoom?.room_type === "PRIVATE";

  const isChatDisabled =
    (isProjectRoom && activeRoom?.project?.is_active === false) ||
    (isPrivateRoom &&
      activeRoom?.participants?.find((p) => p.id !== currentUser.id)?.is_active === false);


  return (
    <div className="flex h-screen bg-[#F9FAFB] text-[#1A2A44]">
      <ChatSidebar
        rooms={chatRooms}
        activeRoomId={activeRoom?.id}
        onSelectRoom={handleRoomSelect}
        onOpenNewChat={() => setShowUserList(true)}
        currentUser={currentUser}
      />

      <div className="flex flex-col flex-1">
        {activeRoom ? (
          <>
            <ChatHeader room={activeRoom} currentUser={currentUser} />
            {loadingMessages ? (
              <div className="flex-1 flex items-center justify-center">Loading messages...</div>
            ) : (
              <MessageList messages={messages} currentUser={currentUser} />
            )}
            {isChatDisabled && (
              <div className="px-4 text-sm text-red-500 bg-[#FFF8F8] border-t border-red-200">
                {isProjectRoom
                  ? "Chat is disabled because this project is inactive."
                  : "Chat is disabled because the user is inactive."}
              </div>
            )}
            <MessageInput onSend={handleSendMessage} disabled={isChatDisabled} />
          </>
        ) : loadingRooms ? (
          <div className="flex-1 flex items-center justify-center">Loading chat rooms...</div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-gray-500">No chat rooms available</p>
          </div>
        )}
      </div>

      {showUserList && (
        <UserListModal
          onClose={() => setShowUserList(false)}
          onStartChat={async (userId) => {
            const existingRoom = chatRooms.find((room) => {
              if (room.room_type !== "PRIVATE") return false;
              const participantIds = room.participants.map((p) => p.id);
              return participantIds.includes(userId) && participantIds.includes(currentUser.id);
            });
          
            if (existingRoom) {
              setActiveRoom(existingRoom);
              setShowUserList(false);
              return;
            }
          
            try {
              const res = await apiClient.post("/api/private-chat/", {
                participants: [currentUser.id, userId],
              });
              const newRoom = res.data;
              setChatRooms((prev) => [newRoom, ...prev]);
              setActiveRoom(newRoom);
              setShowUserList(false);
            } catch (err) {
              alert("Failed to create private chat.");
            }
          }}
        />
      )}
    </div>
  );
};

export default ChatDashboard;