import { createSlice } from '@reduxjs/toolkit';

const initialToken = localStorage.getItem("token");

let decodedUser = null;
if (initialToken) {
  try {
    decodedUser = JSON.parse(atob(initialToken.split(".")[1]));
  } catch (e) {
    localStorage.removeItem("token");
  }
}

const initialState = {
  token: initialToken || null,
  user: decodedUser || null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess: (state, action) => {
      state.token = action.payload.token;
      state.user = action.payload.user;
      localStorage.setItem("token", action.payload.token);
    },
    logout: (state) => {
      state.token = null;
      state.user = null;
      localStorage.removeItem("token");
    },
  },
});

export const { loginSuccess, logout } = authSlice.actions;
export default authSlice.reducer;
