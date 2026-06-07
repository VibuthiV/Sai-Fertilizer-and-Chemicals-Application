// src/utils/jwtHelper.ts — JWT token utilities

import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface JwtPayload {
  userId: number;
  username: string;
  role: 'admin';
  iat?: number;
  exp?: number;
}

/**
 * Generate a signed JWT token for a user.
 */
export const generateToken = (payload: Omit<JwtPayload, 'iat' | 'exp'>): string => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  } as jwt.SignOptions);
};

/**
 * Verify and decode a JWT token.
 * Throws if invalid or expired.
 */
export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
};

/**
 * Decode a token without verification (for inspection only).
 */
export const decodeToken = (token: string): JwtPayload | null => {
  return jwt.decode(token) as JwtPayload | null;
};
