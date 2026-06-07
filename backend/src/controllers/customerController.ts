// src/controllers/customerController.ts — Customer Controller

import { Request, Response, NextFunction } from 'express';
import { customerService } from '../services/customerService';
import { ApiResponse } from '../utils/ApiResponse';

export const customerController = {
  getAll: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string || '1', 10);
      const limit = parseInt(req.query.limit as string || '20', 10);
      const search = req.query.search as string | undefined;

      const result = await customerService.getAll({ search, page, limit });
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
      const customer = await customerService.getById(id);
      const { statusCode, body } = ApiResponse.success(customer);
      res.status(statusCode).json(body);
    } catch (err) {
      next(err);
    }
  },

  create: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const customer = await customerService.create(req.body);
      const { statusCode, body } = ApiResponse.created(customer, 'Customer created');
      res.status(statusCode).json(body);
    } catch (err) {
      next(err);
    }
  },

  update: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      const customer = await customerService.update(id, req.body);
      const { statusCode, body } = ApiResponse.success(customer, 'Customer updated');
      res.status(statusCode).json(body);
    } catch (err) {
      next(err);
    }
  },

  delete: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      await customerService.delete(id);
      const { statusCode, body } = ApiResponse.success(null, 'Customer deleted');
      res.status(statusCode).json(body);
    } catch (err) {
      next(err);
    }
  },
};
