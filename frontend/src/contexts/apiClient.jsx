import axios from 'axios';
import { getSubdomain } from '../utils/domainUtils';

const protocol = window.location.protocol;
const rootDomain = import.meta.env.VITE_ROOT_DOMAIN;
const subdomain = getSubdomain();

const BASE_URL = subdomain
  ? `${protocol}//${subdomain}.${rootDomain}`
  : import.meta.env.VITE_API_BASE_URL;


const apiClient = axios.create({
  baseURL: BASE_URL,
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
        await axios.post(`${BASE_URL}/token/refresh/`, null, {
          withCredentials: true,
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