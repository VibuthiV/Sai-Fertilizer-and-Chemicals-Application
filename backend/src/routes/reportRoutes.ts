// src/routes/reportRoutes.ts — Reports Routes (all protected)

import { Router } from 'express';
import { reportController } from '../controllers/reportController';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticate);

router.get('/daily', reportController.getDaily);
router.get('/weekly', reportController.getWeekly);
router.get('/monthly', reportController.getMonthly);
router.get('/yearly', reportController.getYearly);
router.get('/summary', reportController.getSummary);
router.get('/trend', reportController.getTrend);

export default router;
