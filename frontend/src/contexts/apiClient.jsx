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

const processQueue = (error, response) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(response);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    const isUnauthorized = error.response?.status === 401;
    const alreadyRetried = originalRequest._retry;

    if (isUnauthorized && !alreadyRetried) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        });
      }

      isRefreshing = true;

      try {
        await apiClient.post("/api/token/refresh/");
        isRefreshing = false;
        processQueue(null, apiClient(originalRequest));
        return apiClient(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        processQueue(refreshError, null);
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;