// src/middlewares/requestLogger.ts — HTTP Request Logger

import { Request, Response, NextFunction } from 'express';
import morgan from 'morgan';
import { env } from '../config/env';

// Use colored dev format in development, combined in production
export const requestLogger = morgan(env.isDev ? 'dev' : 'combined');
