import { useSelector, useDispatch } from "react-redux";
import { logout } from "../features/auth/authSlice";

export default function ProfilePage() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);

  const handleLogout = () => {
    dispatch(logout());
  };

  if (!user) {
    return <p>Please log in to view your profile.</p>;
  }

  return (
    <div>
      <h1>Welcome, {user.name || user.email || 'User'}!</h1>
      <p>Email: {user.email}</p>
      <p>User ID: {user.sub}</p>
      {/* Render more dynamic content */}
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}
