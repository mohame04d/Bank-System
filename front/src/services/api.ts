import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

// Foolproof URL resolver to guarantee cloud connectivity on mobile & desktop
const getBaseUrl = () => {
  let url = import.meta.env.VITE_API_URL;
  if (!url) {
    url = import.meta.env.PROD 
      ? 'https://bank-backend-d28e4.containers.snapdeploy.app/api' 
      : 'http://localhost:3000/api';
  }
  // Remove trailing slashes
  url = url.replace(/\/+$/, '');
  // Automatically append /api if missing
  if (!url.endsWith('/api')) {
    url += '/api';
  }
  return url;
};

// Create an Axios instance
const api = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response Interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Do not intercept 401 errors for auth endpoints
    if (originalRequest.url?.includes('/auth/sign-in') || originalRequest.url?.includes('/auth/refresh-token')) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers['Authorization'] = 'Bearer ' + token;
          return api(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = useAuthStore.getState().refreshToken;

      if (!refreshToken) {
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(`${api.defaults.baseURL}/auth/refresh-token`, { refreshToken });
        
        useAuthStore.getState().setAuth(
          useAuthStore.getState().user!,
          data.access_token,
          data.refresh_token
        );
        
        processQueue(null, data.access_token);
        originalRequest.headers['Authorization'] = 'Bearer ' + data.access_token;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default api;
