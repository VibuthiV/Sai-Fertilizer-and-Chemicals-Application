// src/routes/productRoutes.ts — Product Routes (all protected)

import { Router } from 'express';
import { productController } from '../controllers/productController';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();

// All product routes require authentication
router.use(authenticate);

router.get('/', productController.getAll);
router.get('/:id', productController.getById);
router.post('/', productController.create);
router.put('/:id', productController.update);
router.delete('/:id', productController.delete);

export default router;
