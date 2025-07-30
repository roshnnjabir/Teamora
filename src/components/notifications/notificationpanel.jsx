// src/components/notifications/NotificationPanel.jsx
import { useState } from "react";
import { FaBell } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { markNotificationAsRead } from "../../domains/notifications/features/notificationSlice";
import { socketRef } from "../../domains/notifications/NotificationListener";

const NotificationPanel = () => {
  const [expanded, setExpanded] = useState(false);
  const notifications = useSelector((state) => state.notifications.messages);
  const dispatch = useDispatch();

  const handleToggleRead = (id, isRead) => {
    if (isRead || typeof id !== "number") return;

    // Optimistically update state
    dispatch(markNotificationAsRead(id));

    // Send to WebSocket to persist in DB
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          action: "mark_read",
          notification_id: id,
        })
      );
    } else {
      console.warn("⚠️ WebSocket not open. Cannot mark notification as read in DB.");
    }
  };

  const sortedNotifications = [...notifications].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );

  const unreadCount = sortedNotifications.filter((n) => !n.is_read).length;

  return (
    <div className="relative inline-block text-left z-50">
      <button
        onClick={() => setExpanded((prev) => !prev)}
        className="relative focus:outline-none"
        title="Notifications"
      >
        <FaBell className="w-6 h-6 text-gray-700" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {expanded && (
        <div className="absolute right-0 mt-2 w-80 bg-white border rounded shadow-lg p-4 z-50">
          <h4 className="text-md font-semibold mb-3">Notifications</h4>

          {notifications.length === 0 ? (
            <p className="text-sm text-gray-400">No notifications yet.</p>
          ) : (
            <ul className="space-y-2 max-h-80 overflow-y-auto">
              {sortedNotifications.map((n) => (
                <li
                  key={n.id || `${n.created_at}-${n.message}`}
                  onClick={() => handleToggleRead(n.id, n.is_read)}
                  className={`p-3 rounded border transition duration-150 ease-in-out hover:shadow cursor-pointer ${
                    n.is_read ? "bg-gray-100" : "bg-blue-50 border-blue-200"
                  }`}
                >
                  <p className="text-sm text-gray-800">{n.message}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(n.created_at).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationPanel;