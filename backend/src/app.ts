// src/app.ts — Express Application Entry Point

import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { testConnection } from './config/database';
import { requestLogger } from './middlewares/requestLogger';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';
import routes from './routes';

const app: Application = express();

// ─── Security Middlewares ─────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: env.CORS_ORIGIN,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── Rate Limiting ────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { success: false, message: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// ─── Utility Middlewares ──────────────────────────────────────────────────────
app.use(compression());
app.use(requestLogger);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Fertilizer Shop API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/v1', routes);

// ─── 404 and Error Handlers ───────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────────────────────
const startServer = async (): Promise<void> => {
  try {
    await testConnection();

    app.listen(env.PORT, () => {
      console.log(`\n API Server`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`🚀 Running on: http://localhost:${env.PORT}`);
      console.log(`📋 Health:     http://localhost:${env.PORT}/health`);
      console.log(`📡 API:        http://localhost:${env.PORT}/api/v1`);
      console.log(`🔧 Env:        ${env.NODE_ENV}`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
