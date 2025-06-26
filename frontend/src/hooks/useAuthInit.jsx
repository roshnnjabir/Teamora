import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setUser, clearUser } from '../features/Auth/authSlice';
import apiClient from '../contexts/apiClient';

const useAuthBootstrap = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const bootstrapAuth = async () => {
      try {
        const res = await apiClient.get('/api/me/');
        dispatch(setUser(res.data));
      } catch {
        dispatch(clearUser());
      }
    };

    bootstrapAuth();
  }, [dispatch]);
};

export default useAuthBootstrap;