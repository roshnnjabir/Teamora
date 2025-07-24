// src/layouts/AppLayout.jsx

import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setUser, clearUser } from '../domains/auth/features/authSlice';
import apiClient from '../api/apiClient';
import { Outlet } from 'react-router-dom';
import NotificationListener from '../domains/notifications/NotificationListener';

const roleMap = {
  super_admin: 'Super Admin',
  tenant_admin: 'Tenant Admin',
  project_manager: 'Project Manager',
  hr: 'HR',
  developer: 'Developer', 
};

const AppLayout = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const res = await apiClient.get('/api/me/');
        const user = res.data;
        dispatch(setUser({ ...user, displayRole: roleMap[user.role] || user.role }));
      } catch (error) {
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

  return (
    <>
      <NotificationListener />
      <Outlet />
    </>
  );
};

export default AppLayout;