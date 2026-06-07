// src/routes/authRoutes.ts — Auth Routes

import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authController, authValidation } from '../controllers/authController';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();

// Strict login rate limiter: 10 attempts per 15 minutes per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { success: false, message: 'Too many login attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// POST /api/v1/auth/login — Public
router.post('/login', loginLimiter, authValidation.login, authController.login);

// POST /api/v1/auth/logout — Protected
router.post('/logout', authenticate, authController.logout);

// GET /api/v1/auth/me — Protected
router.get('/me', authenticate, authController.getMe);

// PUT /api/v1/auth/profile — Protected
router.put('/profile', authenticate, authValidation.updateProfile, authController.updateProfile);

// POST /api/v1/auth/change-password — Protected
router.post('/change-password', authenticate, authValidation.changePassword, authController.changePassword);

export default router;
