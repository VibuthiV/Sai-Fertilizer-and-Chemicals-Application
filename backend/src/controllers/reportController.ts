// src/controllers/reportController.ts — Reports Controller

import { Request, Response, NextFunction } from 'express';
import { reportService } from '../services/reportService';
import { ApiResponse } from '../utils/ApiResponse';

export const reportController = {
  getDaily: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const date = req.query.date as string | undefined;
      const data = await reportService.getDaily(date);
      const { statusCode, body } = ApiResponse.success(data);
      res.status(statusCode).json(body);
    } catch (err) {
      next(err);
    }
  },

  getWeekly: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const startDate = req.query.startDate as string | undefined;
      const data = await reportService.getWeekly(startDate);
      const { statusCode, body } = ApiResponse.success(data);
      res.status(statusCode).json(body);
    } catch (err) {
      next(err);
    }
  },

  getMonthly: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const month = req.query.month ? parseInt(req.query.month as string, 10) : undefined;
      const year = req.query.year ? parseInt(req.query.year as string, 10) : undefined;
      const data = await reportService.getMonthly(month, year);
      const { statusCode, body } = ApiResponse.success(data);
      res.status(statusCode).json(body);
    } catch (err) {
      next(err);
    }
  },

  getYearly: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const year = req.query.year ? parseInt(req.query.year as string, 10) : undefined;
      const data = await reportService.getYearly(year);
      const { statusCode, body } = ApiResponse.success(data);
      res.status(statusCode).json(body);
    } catch (err) {
      next(err);
    }
  },

  getSummary: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await reportService.getSummary();
      const { statusCode, body } = ApiResponse.success(data);
      res.status(statusCode).json(body);
    } catch (err) {
      next(err);
    }
  },

  getTrend: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const timeline = (req.query.timeline as string) || 'this_week';
      const data = await reportService.getTrend(timeline);
      const { statusCode, body } = ApiResponse.success(data);
      res.status(statusCode).json(body);
    } catch (err) {
      next(err);
    }
  },
};
