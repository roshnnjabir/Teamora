import axios from 'axios';

const hostname = window.location.hostname;

const tenantSubdomain = hostname.split('.')[0];

const apiClient = axios.create({
  baseURL: `http://${tenantSubdomain}.localhost:8000`,
  withCredentials: true, // important for sending cookies
});

// Flag to avoid multiple refresh requests at the same time
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

apiClient.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    // If 401 and we haven't already retried this request
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue the request while refreshing
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers['Authorization'] = 'Bearer ' + token;
            return apiClient(originalRequest);
          })
          .catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Call refresh token endpoint
        const refreshResponse = await apiClient.post('/api/token/refresh/');
        const newAccessToken = refreshResponse.data.access;

        // Optionally update cookies or local state if needed

        processQueue(null, newAccessToken);
        isRefreshing = false;

        // Update the original request with new access token
        originalRequest.headers['Authorization'] = 'Bearer ' + newAccessToken;
        return apiClient(originalRequest);
      } catch (err) {
        processQueue(err, null);
        isRefreshing = false;
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;

export async function loginUser(email, password) {
  const response = await apiClient.post('/api/token/', { email, password });
  return response.data;
}