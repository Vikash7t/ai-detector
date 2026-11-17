import { CorrelationMiddleware } from './correlation.middleware';
import { Request, Response } from 'express';

describe('CorrelationMiddleware', () => {
  let middleware: CorrelationMiddleware;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    middleware = new CorrelationMiddleware();
    mockRequest = {
      headers: {},
    };
    mockResponse = {
      setHeader: jest.fn(),
    };
    mockNext = jest.fn();
  });

  it('should generate a valid UUID when X-Correlation-ID is missing', () => {
    middleware.use(
      mockRequest as Request,
      mockResponse as Response,
      mockNext,
    );

    expect(mockRequest.correlationId).toBeDefined();
    expect(mockRequest.correlationId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
    expect(mockResponse.setHeader).toHaveBeenCalledWith(
      'X-Correlation-ID',
      mockRequest.correlationId,
    );
    expect(mockResponse.setHeader).toHaveBeenCalledWith(
      'X-Content-Type-Options',
      'nosniff',
    );
    expect(mockResponse.setHeader).toHaveBeenCalledWith(
      'X-Frame-Options',
      'DENY',
    );
    expect(mockNext).toHaveBeenCalledTimes(1);
  });

  it('should preserve valid custom correlation ID', () => {
    mockRequest.headers = {
      'x-correlation-id': 'client-custom-req-12345',
    };

    middleware.use(
      mockRequest as Request,
      mockResponse as Response,
      mockNext,
    );

    expect(mockRequest.correlationId).toBe('client-custom-req-12345');
    expect(mockResponse.setHeader).toHaveBeenCalledWith(
      'X-Correlation-ID',
      'client-custom-req-12345',
    );
  });

  it('should discard and replace invalid correlation IDs (log injection prevention)', () => {
    mockRequest.headers = {
      'x-correlation-id': 'evil\r\n[CRITICAL] fake log injection attack',
    };

    middleware.use(
      mockRequest as Request,
      mockResponse as Response,
      mockNext,
    );

    expect(mockRequest.correlationId).not.toContain('\r');
    expect(mockRequest.correlationId).not.toContain('fake log');
    expect(mockRequest.correlationId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });
});
