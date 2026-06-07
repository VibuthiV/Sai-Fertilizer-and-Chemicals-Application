// services/authService.ts — Authentication API calls

import api from './api';
import { API_ENDPOINTS } from '@/constants/api';
import { LoginCredentials, AuthResponse, AuthUser } from '@/types/auth.types';
import { storage } from '@/utils/storage';

export const authService = {
  /**
   * POST /auth/login — Authenticate and receive JWT token
   */
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>(API_ENDPOINTS.LOGIN, credentials);
    // Persist token securely
    await storage.setItem('authToken', data.token);
    return data;
  },

  /**
   * POST /auth/logout — Invalidate token on server
   */
  logout: async (): Promise<void> => {
    try {
      await api.post(API_ENDPOINTS.LOGOUT);
    } catch {
      // Ignore server errors on logout; always clear local token
    } finally {
      await storage.removeItem('authToken');
    }
  },

  /**
   * GET /auth/me — Get current authenticated user
   */
  getMe: async (): Promise<AuthUser> => {
    const { data } = await api.get<AuthUser>(API_ENDPOINTS.ME);
    return data;
  },

  /**
   * PUT /auth/profile — Update admin and shop details
   */
  updateProfile: async (profileData: {
    adminName: string;
    shopName: string;
    contactPhone: string;
    address: string;
    gstin: string;
  }): Promise<AuthUser> => {
    const { data } = await api.put<AuthUser>(
      API_ENDPOINTS.UPDATE_PROFILE,
      profileData
    );
    return data;
  },

  /**
   * POST /auth/change-password — Update authentication password
   */
  changePassword: async (passwordData: {
    oldPassword: string;
    newPassword: string;
  }): Promise<void> => {
    await api.post(API_ENDPOINTS.CHANGE_PASSWORD, passwordData);
  },

  /**
   * Check if a JWT token is stored locally
   */
  getStoredToken: async (): Promise<string | null> => {
    return storage.getItem('authToken');
  },
};
