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

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
