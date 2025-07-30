// src/components/notifications/NotificationListener.jsx
import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addNotification } from "../../domains/notifications/features/notificationSlice";
import { createWebSocket } from "../../utils/wsClient";

export const socketRef = { current: null }; // Export for global access

const NotificationListener = () => {
  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();

  useEffect(() => {
    if (!user?.id) return;

    const socket = createWebSocket("/ws/notifications/");
    socketRef.current = socket;

    socket.onopen = () => console.log("🔔 Notification WebSocket connected");

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("📥 Notification received:", data);
      dispatch(addNotification(data));
    };

    socket.onerror = (err) => console.error("❌ Notification socket error", err);
    socket.onclose = (e) => console.warn("🔕 Notification WebSocket closed", e.code);

    return () => socket.close();
  }, [user?.id]);

  return null;
};

export default NotificationListener;