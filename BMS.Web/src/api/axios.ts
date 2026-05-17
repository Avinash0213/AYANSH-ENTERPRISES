import axios from 'axios';

let baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5256/api';
if (baseURL && !baseURL.endsWith('/api')) {
  baseURL = baseURL.endsWith('/') ? `${baseURL}api` : `${baseURL}/api`;
}

export const api = axios.create({
  baseURL,
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let failedQueue: Array<{ resolve: (value?: unknown) => void; reject: (reason?: any) => void }> = [];

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

api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers.Authorization = 'Bearer ' + token;
            return api(originalRequest);
          })
          .catch(err => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${baseURL}/auth/refresh`, `"${refreshToken}"`, {
            headers: { 'Content-Type': 'application/json' }
          });
          
          const newToken = data.accessToken;
          const newRefreshToken = data.refreshToken;
          
          localStorage.setItem('token', newToken);
          if (newRefreshToken) {
            localStorage.setItem('refreshToken', newRefreshToken);
          }
          
          api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          
          processQueue(null, newToken);
          return api(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError, null);
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      } else {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
