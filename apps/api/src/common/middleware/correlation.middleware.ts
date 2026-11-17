import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as crypto from 'crypto';

// Extend Express Request interface to include correlationId
declare global {
  namespace Express {
    interface Request {
      correlationId?: string;
    }
  }
}

@Injectable()
export class CorrelationMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const rawHeader = req.headers['x-correlation-id'];
    let correlationId: string;

    // Validate incoming correlation ID: alphanumeric, dashes, underscores, max 64 chars
    if (
      typeof rawHeader === 'string' &&
      /^[a-zA-Z0-9_-]{1,64}$/.test(rawHeader)
    ) {
      correlationId = rawHeader;
    } else {
      correlationId = crypto.randomUUID();
    }

    req.correlationId = correlationId;
    res.setHeader('X-Correlation-ID', correlationId);

    // Apply baseline HTTP security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    next();
  }
}
