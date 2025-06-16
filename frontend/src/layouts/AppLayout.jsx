import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setUser, clearUser } from '../features/Auth/authSlice';
import apiClient from '../api/auth/login';
import { Outlet } from 'react-router-dom'; // if using react-router

const AppLayout = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const res = await apiClient.get('/api/me/');
        dispatch(setUser(res.data));
      } catch (error) {
        dispatch(clearUser());
      }
    };

    restoreSession();
  }, [dispatch]);

  return (
    <>
      <Outlet />
    </>
  );
};

export default AppLayout;