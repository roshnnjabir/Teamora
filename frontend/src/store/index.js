import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../domains/auth/features/authSlice';
import notificationReducer from "../domains/notifications/features/notificationSlice";


export const store = configureStore({
  reducer: {
    auth: authReducer,
    notifications: notificationReducer,
  },
});
