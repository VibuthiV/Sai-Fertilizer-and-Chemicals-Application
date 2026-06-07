// src/types/express.d.ts — Express type augmentation

import { JwtPayload } from '../utils/jwtHelper';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export {};
