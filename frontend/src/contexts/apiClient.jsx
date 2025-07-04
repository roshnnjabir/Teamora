import axios from 'axios';

const getSubdomain = () => {
  const host = window.location.hostname;
  const parts = host.split('.');
  return parts.length > 2 ? parts[0] : null;
};

const BASE_URL = `https://api.chronocrust.shop/api`;
const subdomain = getSubdomain();

const apiClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: subdomain ? { 'X-Tenant': subdomain } : {},
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(apiClient(token));
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    const isUnauthorized = error.response?.status === 401;
    const isTokenExpired =
      error.response?.data?.detail?.toLowerCase?.().includes("token") ?? false;

    if (isUnauthorized && isTokenExpired && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await axios.post(`${BASE_URL}/token/refresh/`, null, {
          withCredentials: true,
          headers: subdomain ? { 'X-Tenant': subdomain } : {},
        });

        isRefreshing = false;
        processQueue(null, originalRequest);
        return apiClient(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        processQueue(refreshError);
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;