// src/controllers/billController.ts — Billing Controller

import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { billService } from '../services/billService';
import { ApiResponse } from '../utils/ApiResponse';

export const billController = {
  getAll: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string || '1', 10);
      const limit = parseInt(req.query.limit as string || '20', 10);
      const search = req.query.search as string | undefined;
      const customerId = req.query.customerId ? parseInt(req.query.customerId as string, 10) : undefined;

      const result = await billService.getAll({ page, limit, search, customerId });
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
      const bill = await billService.getById(id);
      const { statusCode, body } = ApiResponse.success(bill);
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

      const bill = await billService.create(req.body);
      const { statusCode, body } = ApiResponse.created(bill, 'Bill created successfully');
      res.status(statusCode).json(body);
    } catch (err) {
      next(err);
    }
  },
};
