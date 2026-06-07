// src/routes/billRoutes.ts — Billing Routes (all protected)

import { Router } from 'express';
import { billController } from '../controllers/billController';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();

// All billing routes require authentication
router.use(authenticate);

router.get('/', billController.getAll);
router.get('/:id', billController.getById);
router.post('/', billController.create);

export default router;
