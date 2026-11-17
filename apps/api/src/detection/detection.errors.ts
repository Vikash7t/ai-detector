import { HttpException, HttpStatus } from '@nestjs/common';

export class ProviderUnavailableException extends HttpException {
  constructor(message = 'Detection provider is temporarily unavailable. Please try again shortly.') {
    super(
      {
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        message,
        error: 'PROVIDER_UNAVAILABLE',
      },
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}

export class ProviderRateLimitException extends HttpException {
  constructor(message = 'Detection service is currently busy. Please retry in a few moments.') {
    super(
      {
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        message,
        error: 'PROVIDER_RATE_LIMITED',
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}

export class ProviderTimeoutException extends HttpException {
  constructor(message = 'Detection request timed out after 5.0 seconds. Please try again.') {
    super(
      {
        statusCode: HttpStatus.GATEWAY_TIMEOUT,
        message,
        error: 'TIMEOUT',
      },
      HttpStatus.GATEWAY_TIMEOUT,
    );
  }
}
