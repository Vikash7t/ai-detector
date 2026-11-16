import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { fromNodeHeaders } from 'better-auth/node';
import { AuthService } from './auth.service';
import { IS_PUBLIC_KEY } from './auth.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest();
    const headers = fromNodeHeaders(request.headers);

    try {
      const session = await this.authService.instance.api.getSession({
        headers,
      });

      if (session && session.user) {
        request.user = session.user;
        request.session = session.session;
        return true;
      }
    } catch {
      // Session lookup failed or invalid cookie
    }

    if (isPublic) {
      return true;
    }

    throw new UnauthorizedException('Authentication required');
  }
}
