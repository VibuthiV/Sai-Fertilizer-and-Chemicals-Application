// src/routes/customerRoutes.ts — Customer Routes (all protected)

import { Router } from 'express';
import { customerController } from '../controllers/customerController';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticate);

router.get('/', customerController.getAll);
router.get('/:id', customerController.getById);
router.post('/', customerController.create);
router.put('/:id', customerController.update);
router.delete('/:id', customerController.delete);

export default router;
