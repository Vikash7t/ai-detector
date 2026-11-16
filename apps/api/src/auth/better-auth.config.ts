import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { PrismaClient } from '@prisma/client';

export function createBetterAuth(prisma: PrismaClient) {
  const googleEnabled = Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
  );

  return betterAuth({
    database: prismaAdapter(prisma, {
      provider: 'postgresql',
    }),
    emailAndPassword: {
      enabled: true,
      autoSignIn: true,
    },
    socialProviders: googleEnabled
      ? {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
          },
        }
      : undefined,
    secret:
      process.env.BETTER_AUTH_SECRET ||
      'development_secret_key_at_least_32_characters_long',
    baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
  });
}

export type AuthInstance = ReturnType<typeof createBetterAuth>;
