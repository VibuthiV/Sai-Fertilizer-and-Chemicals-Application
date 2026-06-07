// src/middlewares/authMiddleware.ts — JWT Authentication Middleware

import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwtHelper';
import { ApiResponse } from '../utils/ApiResponse';

/**
 * Middleware to protect routes with JWT authentication.
 * Extracts the Bearer token from Authorization header, verifies it,
 * and attaches the decoded payload to req.user.
 */
export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const { statusCode, body } = ApiResponse.unauthorized();
      res.status(statusCode).json(body);
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    const { statusCode, body } = ApiResponse.unauthorized();
    res.status(statusCode).json(body);
  }
};

/**
 * Middleware to restrict access to admin role only.
 * Must be used after authenticate.
 */
export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user || req.user.role !== 'admin') {
    const { statusCode, body } = ApiResponse.forbidden();
    res.status(statusCode).json(body);
    return;
  }
  next();
};
