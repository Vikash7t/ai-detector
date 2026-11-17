import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction): void {
    const startTime = Date.now();

    res.on('finish', () => {
      const latencyMs = Date.now() - startTime;
      const correlationId = req.correlationId || 'none';
      const statusCode = res.statusCode;
      const method = req.method;
      const url = req.originalUrl || req.url;

      // Note: Zero-retention privacy guarantee:
      // Under no circumstances do we log req.body or submitted text.
      const logLine = `${method} ${url} ${statusCode} - ${latencyMs}ms [correlationId: ${correlationId}]`;

      if (statusCode >= 500) {
        this.logger.error(logLine);
      } else if (statusCode >= 400) {
        this.logger.warn(logLine);
      } else {
        this.logger.log(logLine);
      }
    });

    next();
  }
}
