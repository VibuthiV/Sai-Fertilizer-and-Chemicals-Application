// services/api.ts — Axios Instance with Auth Interceptors

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL } from '@/constants/api';
import { storage } from '@/utils/storage';

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// ─── Request Interceptor ─────────────────────────────────────────────────────
// Attach JWT token to every request automatically
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await storage.getItem('authToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// ─── Response Interceptor ────────────────────────────────────────────────────
// Unpack the standardized response envelope and handle 401s
api.interceptors.response.use(
  (response) => {
    if (response.data && response.data.success === true && response.data.data !== undefined) {
      response.data = response.data.data;
    }
    return response;
  },
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      await storage.removeItem('authToken');
      // Navigation to login is handled by components via Redux auth state
    }
    return Promise.reject(error);
  }
);

export default api;
