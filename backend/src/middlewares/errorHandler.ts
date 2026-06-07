// src/middlewares/errorHandler.ts — Global Error Handler

import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../utils/ApiResponse';
import { env } from '../config/env';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

/**
 * Global async error handler.
 * Catches all errors thrown in route handlers and services.
 */
export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;
  const message = err.isOperational
    ? err.message
    : 'Internal Server Error';

  if (env.isDev) {
    console.error('❌ Error:', {
      message: err.message,
      stack: err.stack,
      url: req.url,
      method: req.method,
    });
  }

  const { body } = ApiResponse.error(message, statusCode);
  res.status(statusCode).json(body);
};

/**
 * Handle 404 routes — must be registered after all routes.
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  const { statusCode, body } = ApiResponse.notFound(`Route ${req.url}`);
  res.status(statusCode).json(body);
};

/**
 * Helper to create operational errors.
 */
export const createError = (message: string, statusCode: number): AppError => {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
};
