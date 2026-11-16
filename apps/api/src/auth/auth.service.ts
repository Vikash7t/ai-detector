import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { createBetterAuth, AuthInstance } from './better-auth.config';

@Injectable()
export class AuthService implements OnModuleInit {
  private authInstance!: AuthInstance;

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    this.authInstance = createBetterAuth(this.prisma);
  }

  get instance(): AuthInstance {
    return this.authInstance;
  }
}
