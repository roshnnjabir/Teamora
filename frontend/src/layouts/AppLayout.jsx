import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setUser, clearUser } from '../domains/auth/features/authSlice';
import apiClient from '../api/apiClient';
import { Outlet } from 'react-router-dom';

const AppLayout = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const res = await apiClient.get('/api/me/');
        dispatch(setUser(res.data));
      } catch (error) {
        console.warn('Session restore failed:', error);
        if (error.response?.status === 401) {
          dispatch(clearUser());
        }
      }
    };

    restoreSession();

    const interval = setInterval(async () => {
      try {
        await apiClient.post('/api/token/refresh/');
      } catch (err) {
        console.warn('Silent refresh failed:', err);
      }
    }, 4 * 60 * 1000); // every 4 min

    return () => clearInterval(interval);
  }, []);

  return <Outlet />;
};

export default AppLayout;