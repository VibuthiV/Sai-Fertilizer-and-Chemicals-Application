// src/routes/authRoutes.ts — Auth Routes

import { Router } from 'express';
import { authController, authValidation } from '../controllers/authController';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();

// POST /api/v1/auth/login — Public
router.post('/login', authValidation.login, authController.login);

// POST /api/v1/auth/logout — Protected
router.post('/logout', authenticate, authController.logout);

// GET /api/v1/auth/me — Protected
router.get('/me', authenticate, authController.getMe);

// PUT /api/v1/auth/profile — Protected
router.put('/profile', authenticate, authValidation.updateProfile, authController.updateProfile);

// POST /api/v1/auth/change-password — Protected
router.post('/change-password', authenticate, authValidation.changePassword, authController.changePassword);

export default router;
