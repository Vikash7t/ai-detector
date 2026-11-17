import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import * as express from 'express';
import { AppModule } from './app.module';
import { EXACT_TRUSTED_PROXY_CIDRS } from './config/trusted-proxies.config';
import { CorrelationMiddleware } from './common/middleware/correlation.middleware';
import { RequestLoggerMiddleware } from './common/middleware/request-logger.middleware';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: true,
  });

  // 1. Exact Trusted Proxy Configuration
  const trustedProxies = process.env.TRUSTED_PROXY_CIDRS
    ? process.env.TRUSTED_PROXY_CIDRS.split(',').map((c) => c.trim())
    : EXACT_TRUSTED_PROXY_CIDRS;
  app.set('trust proxy', trustedProxies);

  // 2. Correlation ID & Structured Request Logger Middleware
  const correlationMiddleware = new CorrelationMiddleware();
  const requestLoggerMiddleware = new RequestLoggerMiddleware();
  app.use(
    correlationMiddleware.use.bind(correlationMiddleware),
    requestLoggerMiddleware.use.bind(requestLoggerMiddleware),
  );

  // 3. Transport Body Limits (Hard limit 100 KB)
  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ limit: '100kb', extended: true }));

  // 4. CORS, Exposed Headers & Cookie Credentials
  const frontendUrl = process.env.BETTER_AUTH_URL || 'http://localhost:3000';
  app.enableCors({
    origin: [frontendUrl, 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-Client-Platform',
      'Idempotency-Key',
      'X-Correlation-ID',
    ],
    exposedHeaders: ['X-Correlation-ID'],
  });

  // 5. Global Input Validation
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`AI Detector API service listening on port ${port}`);
}

bootstrap();
