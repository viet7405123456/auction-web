import axios from 'axios';
import { clearAuthAndRedirect, ensureValidAccessToken, refreshAccessToken } from './refreshTokenService.js'

const AUTH_KEY = 'auth';

export const apiClient = axios.create({
  baseURL: 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await ensureValidAccessToken();

      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      clearAuthAndRedirect();
      return Promise.reject(error);
    }

    return config;
  },
  (error) => Promise.reject(error),
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status
    const originalRequest = error?.config || {}

    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      try {
        const nextAccessToken = await refreshAccessToken()
        originalRequest.headers = originalRequest.headers || {}
        originalRequest.headers.Authorization = `Bearer ${nextAccessToken}`
        return apiClient(originalRequest)
      } catch {
        clearAuthAndRedirect()
      }
    }

    return Promise.reject(error)
  },
);
