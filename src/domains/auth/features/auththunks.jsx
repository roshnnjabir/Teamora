import { clearUser, logout } from "./authSlice";

export function logoutUser() {
  return async (dispatch) => {
    try {
      await logout();          // Call backend
      dispatch(clearUser());   // Clear Redux state
    } catch (error) {
      console.error("Logout failed", error);
    }
  };
}
