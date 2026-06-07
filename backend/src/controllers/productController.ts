// src/controllers/productController.ts — Product Controller

import { Request, Response, NextFunction } from 'express';
import { body, param, query as queryValidator, validationResult } from 'express-validator';
import { productService } from '../services/productService';
import { ApiResponse } from '../utils/ApiResponse';

export const productController = {
  getAll: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string || '1', 10);
      const limit = parseInt(req.query.limit as string || '20', 10);
      const search = req.query.search as string | undefined;
      const category = req.query.category as string | undefined;
      const lowStock = req.query.lowStock === 'true';

      const result = await productService.getAll({ search, category, lowStock, page, limit });
      const { statusCode, body } = ApiResponse.paginated(
        result.items, result.total, result.page, limit
      );
      res.status(statusCode).json(body);
    } catch (err) {
      next(err);
    }
  },

  getById: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      const product = await productService.getById(id);
      const { statusCode, body } = ApiResponse.success(product);
      res.status(statusCode).json(body);
    } catch (err) {
      next(err);
    }
  },

  create: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const { statusCode, body } = ApiResponse.error('Validation failed', 422);
        res.status(statusCode).json(body);
        return;
      }
      const product = await productService.create(req.body);
      const { statusCode, body } = ApiResponse.created(product, 'Product created');
      res.status(statusCode).json(body);
    } catch (err) {
      next(err);
    }
  },

  update: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      const product = await productService.update(id, req.body);
      const { statusCode, body } = ApiResponse.success(product, 'Product updated');
      res.status(statusCode).json(body);
    } catch (err) {
      next(err);
    }
  },

  delete: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      await productService.delete(id);
      const { statusCode, body } = ApiResponse.success(null, 'Product deleted');
      res.status(statusCode).json(body);
    } catch (err) {
      next(err);
    }
  },
};
