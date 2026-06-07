// src/controllers/authController.ts — Auth Controller

import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { authService } from '../services/authService';
import { ApiResponse } from '../utils/ApiResponse';

export const authValidation = {
  login: [
    body('username').trim().notEmpty().withMessage('Username is required'),
    body('password').trim().notEmpty().withMessage('Password is required'),
  ],
  updateProfile: [
    body('adminName').trim().notEmpty().withMessage('Admin Name is required'),
    body('shopName').trim().notEmpty().withMessage('Shop Name is required'),
    body('contactPhone').trim().notEmpty().withMessage('Contact Number is required'),
    body('address').trim().notEmpty().withMessage('Address is required'),
    body('gstin').trim().notEmpty().withMessage('GSTIN is required'),
  ],
  changePassword: [
    body('oldPassword').trim().notEmpty().withMessage('Old password is required'),
    body('newPassword')
      .trim()
      .isLength({ min: 6 })
      .withMessage('New password must be at least 6 characters long'),
  ],
};

export const authController = {
  /**
   * POST /api/v1/auth/login
   */
  login: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const grouped: Record<string, string[]> = {};
        errors.array().forEach((e: any) => {
          const path = e.path || 'general';
          if (!grouped[path]) grouped[path] = [];
          grouped[path].push(e.msg);
        });
        const { statusCode, body } = ApiResponse.validationError(grouped);
        res.status(statusCode).json(body);
        return;
      }

      const { username, password } = req.body;
      const result = await authService.login(username, password);
      const { statusCode, body } = ApiResponse.success(result, 'Login successful');
      res.status(statusCode).json(body);
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/v1/auth/me
   */
  getMe: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await authService.getById(req.user!.userId);
      const { statusCode, body } = ApiResponse.success(user);
      res.status(statusCode).json(body);
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/v1/auth/logout
   */
  logout: (_req: Request, res: Response): void => {
    // JWT is stateless; client should discard the token
    const { statusCode, body } = ApiResponse.success(null, 'Logged out successfully');
    res.status(statusCode).json(body);
  },

  /**
   * PUT /api/v1/auth/profile
   */
  updateProfile: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const grouped: Record<string, string[]> = {};
        errors.array().forEach((e: any) => {
          const path = e.path || 'general';
          if (!grouped[path]) grouped[path] = [];
          grouped[path].push(e.msg);
        });
        const { statusCode, body } = ApiResponse.validationError(grouped);
        res.status(statusCode).json(body);
        return;
      }

      const { adminName, shopName, contactPhone, address, gstin } = req.body;
      const updatedUser = await authService.updateProfile(req.user!.userId, {
        adminName,
        shopName,
        contactPhone,
        address,
        gstin,
      });

      const { statusCode, body } = ApiResponse.success(updatedUser, 'Profile updated successfully');
      res.status(statusCode).json(body);
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/v1/auth/change-password
   */
  changePassword: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const grouped: Record<string, string[]> = {};
        errors.array().forEach((e: any) => {
          const path = e.path || 'general';
          if (!grouped[path]) grouped[path] = [];
          grouped[path].push(e.msg);
        });
        const { statusCode, body } = ApiResponse.validationError(grouped);
        res.status(statusCode).json(body);
        return;
      }

      const { oldPassword, newPassword } = req.body;
      await authService.changePassword(req.user!.userId, oldPassword, newPassword);

      const { statusCode, body } = ApiResponse.success(null, 'Password changed successfully');
      res.status(statusCode).json(body);
    } catch (err) {
      next(err);
    }
  },
};
