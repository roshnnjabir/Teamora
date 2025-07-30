import axios from 'axios';
import { getSubdomain } from '../utils/domainUtils';

const protocol = import.meta.env.VITE_PROTOCOL;
const rootDomain = import.meta.env.VITE_ROOT_DOMAIN;
const subdomain = getSubdomain();

const BASE_URL = subdomain
  ? `${protocol}://${subdomain}.${rootDomain}`
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

    const status = error?.response?.status;
    const detail = error?.response?.data?.detail || "";
    const code = error?.response?.data?.code;

    // 🔐 Token expired, attempt refresh
    if (status === 401 && detail.toLowerCase().includes("token") && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await axios.post(`${BASE_URL}/api/token/refresh/`, null, {
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

    // ⛔️ Trial expired / payment required
    if (status === 403 && code === "payment_required") {
      // Optional: prevent redirect loop
      if (window.location.pathname !== "/payment-required") {
        window.location.href = "/payment-required";
      }
    }

    // 📍 Server wants to redirect client (custom error)
    if (error.response?.data?.redirect) {
      window.location.href = error.response.data.redirect;
    }

    return Promise.reject(error);
  }
);

export default apiClient;