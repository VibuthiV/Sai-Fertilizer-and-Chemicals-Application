// src/routes/index.ts — Route Aggregator

import { Router } from 'express';
import authRoutes from './authRoutes';
import productRoutes from './productRoutes';
import customerRoutes from './customerRoutes';
import reportRoutes from './reportRoutes';
import billRoutes from './billRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/customers', customerRoutes);
router.use('/reports', reportRoutes);
router.use('/bills', billRoutes);

export default router;

