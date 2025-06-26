import axios from 'axios';

const hostname = window.location.hostname;
const protocol = window.location.protocol;
let tenantSubdomain = null;

if (hostname.includes('.') && !hostname.startsWith('localhost')) {
  tenantSubdomain = hostname.split('.')[0];
  console.log("Subdomain:", tenantSubdomain);
}

const baseURL = tenantSubdomain
  ? `${protocol}//${tenantSubdomain}.localhost:8000`
  : `${protocol}//localhost:8000`;

const apiClient = axios.create({
  baseURL,
  withCredentials: true,
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
        await apiClient.post("/api/token/refresh/");
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