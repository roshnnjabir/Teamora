import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../domains/auth/features/authSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
});
