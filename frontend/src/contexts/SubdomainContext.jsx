// src/contexts/SubdomainContext.jsx

import {
  createContext, useContext, useEffect, useState, useMemo, useRef,
} from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import { setUserRoleAndPermissions } from '../redux/slice/authrizeSlice';
import { setProfile } from '../redux/slice/ProfileSlice';
import { setEmployeeSubdomain } from '../redux/slice/EmployeeSlice';

const SubdomainContext = createContext(null);
const PUBLIC_PATHS = new Set(['/', '/login', '/signup', '/otp']);

export const SubdomainProvider = ({ children }) => {
  const [state, setState] = useState({
    subdomain: null,
    isLoading: true,
    isValid: false,
    tenantIdentified: false,
  });

  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const hasRun = useRef(false);
  const userRole = useSelector((state) => state.auth.role);

  const isTokenExpired = (token) => {
    try {
      const decoded = jwtDecode(token);
      return decoded.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  };

  const refreshAccessToken = async (refreshToken, subdomain) => {
    if (!refreshToken) return null;

    const endpoint =
      userRole === 'superadmin'
        ? `http://${subdomain}.localhost:8000/api/token/refresh/`
        : `http://${subdomain}.localhost:8000/api/token/employee_refresh/`;

    try {
      const { data } = await axios.post(endpoint, { refresh: refreshToken });
      const newAccessToken = data.access;
      localStorage.setItem('access_token', newAccessToken);

      const decoded = jwtDecode(newAccessToken);
      dispatch(setUserRoleAndPermissions({
        role: decoded.role,
        permissions: decoded.permissions || [],
      }));

      return newAccessToken;
    } catch (err) {
      console.error('Refresh failed:', err);
      localStorage.clear();
      window.location.href = 'http://localhost:5173/login';
      return null;
    }
  };

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const checkAuth = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const access = params.get('access');
        const refresh = params.get('refresh');
        const profile = JSON.parse(params.get('profile'));

        if (access && refresh) {
          localStorage.setItem('access_token', access);
          localStorage.setItem('refresh_token', refresh);

          const decoded = jwtDecode(access);
          localStorage.setItem('subdomain', decoded.subdomain);

          dispatch(setProfile({
            id: profile.id,
            name: profile.owner_name,
            email: profile.email,
            phone: profile.contact,
            role: decoded.role,
            company: profile.company || 'Unknown',
            joined_date: profile.created_on,
          }));

          dispatch(setUserRoleAndPermissions({
            role: decoded.role,
            permissions: decoded.permissions || [],
          }));

          window.history.replaceState(null, null, window.location.pathname);
        }

        let subdomain = localStorage.getItem('subdomain');
        let token = localStorage.getItem('access_token');
        const refreshToken = localStorage.getItem('refresh_token');

        if (!subdomain) {
          const parts = window.location.hostname.split('.');
          if (parts.length > 1 && parts[0] !== 'localhost') {
            subdomain = parts[0];
            localStorage.setItem('subdomain', subdomain);
          }
        }

        if (PUBLIC_PATHS.has(location.pathname)) {
          setState({ subdomain: null, isLoading: false, isValid: false });
          return;
        }

        if (!subdomain) {
          setState({ isLoading: false, isValid: false });
          navigate('/login');
          return;
        }

        if (!token && location.pathname === '/signin') {
          try {
            const res = await axios.get(`http://${subdomain}.localhost:8000/api/`);
            if (res.data.status) {
              setState({ subdomain, isLoading: false, isValid: true });
              dispatch(setEmployeeSubdomain(subdomain));
              return;
            } else {
              setState({ isLoading: false, isValid: false });
              navigate('/');
              return;
            }
          } catch {
            localStorage.clear();
            setState({ isLoading: false, isValid: false });
            navigate('/');
            return;
          }
        }

        if (!token || isTokenExpired(token)) {
          const refreshed = await refreshAccessToken(refreshToken, subdomain);
          if (!refreshed) {
            setState({ isLoading: false, isValid: false });
            window.location.href = 'http://localhost:5173/login';
            return;
          }
          token = refreshed;
        }

        setState({ subdomain, isLoading: false, isValid: true });

        const expectedHost = `${subdomain}.localhost`;
        if (
          window.location.hostname !== expectedHost &&
          window.location.hostname !== 'localhost'
        ) {
          window.location.href = `http://${expectedHost}:5173/dashboard`;
        }

      } catch (err) {
        console.error('Auth error:', err);
        localStorage.clear();
        setState({ isLoading: false, isValid: false });
        window.location.href = 'http://localhost:5173/login';
      }
    };

    checkAuth();
  }, [location.pathname]);

  const contextValue = useMemo(() => state, [state]);

  return (
    <SubdomainContext.Provider value={contextValue}>
      {children}
    </SubdomainContext.Provider>
  );
};

export const useSubdomain = () => {
  const ctx = useContext(SubdomainContext);
  if (!ctx) {
    throw new Error('useSubdomain must be used within SubdomainProvider');
  }
  return ctx;
};