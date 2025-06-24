import axios from 'axios';

const hostname = window.location.hostname;
let tenantSubdomain = null;

if (hostname.includes('.') && !hostname.startsWith('localhost')) {
  tenantSubdomain = hostname.split('.')[0];
  console.log("Subdomain:", tenantSubdomain);
}

const baseURL = tenantSubdomain
  ? `http://${tenantSubdomain}.localhost:8000`
  : `http://localhost:8000`;

const apiClient = axios.create({
  baseURL,
  withCredentials: true,
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error) => {
  failedQueue.forEach(({ reject }) => reject(error));
  failedQueue = [];
};

apiClient.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    const isUnauthorized = error.response?.status === 401;
    const isTokenExpired = error.response?.data?.detail?.toLowerCase?.().includes("token") ?? false;

    // Only refresh if token actually expired
    if (isUnauthorized && isTokenExpired && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((_, reject) => {
          failedQueue.push({ reject });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await apiClient.post('/api/token/refresh/');
        isRefreshing = false;
        failedQueue = [];

        return apiClient(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        processQueue(refreshError);
        return Promise.reject(refreshError);
      }
    }

    // ✅ If it's not token-related 401, don't try to refresh — pass it on
    return Promise.reject(error);
  }
);

export default apiClient;