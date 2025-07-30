// src/domains/notifications/features/notificationSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  messages: [],
};

const notificationSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    addNotification: (state, action) => {
      const data = action.payload;

      const newNotification = {
        id: data.id || `ws-${Date.now()}`,
        is_read: data.is_read ?? false,
        ...data,
      };

      const exists = state.messages.some(
        (n) =>
          n.id === newNotification.id ||
          (n.message === newNotification.message && n.created_at === newNotification.created_at)
      );

      if (!exists) {
        state.messages.unshift(newNotification);
      }
    },

    markNotificationAsRead: (state, action) => {
      const id = action.payload;
      const target = state.messages.find((n) => n.id === id);
      if (target) {
        target.is_read = true;
      }
    },

    clearNotifications: (state) => {
      state.messages = [];
    },
  },
});

export const {
  addNotification,
  markNotificationAsRead,
  clearNotifications,
} = notificationSlice.actions;

export default notificationSlice.reducer;