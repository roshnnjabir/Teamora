import { createSlice } from '@reduxjs/toolkit';
import apiClient from '../../contexts/apiClient';

const initialState = {
  user: null,   // load this after verifying the session via API
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    clearUser: (state) => {
      state.user = null;
      state.isAuthenticated = false;
    },
  },
});

export async function logout() {
  try {
    await apiClient.post('/api/logout/');
    return true;
  } catch (error) {
    throw new Error("Logout failed");
  }
}

export const { setUser, clearUser } = authSlice.actions;
export default authSlice.reducer;
