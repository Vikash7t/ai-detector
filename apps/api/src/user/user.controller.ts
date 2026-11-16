import { Controller, Get } from '@nestjs/common';
import { CurrentUser, AuthUser } from '../auth/auth.decorator';
import { PrismaService } from '../prisma/prisma.service';

@Controller('api/v1/users')
export class UserController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('me')
  async getMe(@CurrentUser() user: AuthUser) {
    const currentPeriod = new Date().toISOString().slice(0, 7); // YYYY-MM

    const usage = await this.prisma.userUsage.findUnique({
      where: {
        userId_periodKey: {
          userId: user.id,
          periodKey: currentPeriod,
        },
      },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: user.emailVerified,
      },
      usage: {
        periodKey: currentPeriod,
        charactersUsed: usage?.charactersUsed || 0,
        charactersReserved: usage?.charactersReserved || 0,
        monthlyAllowanceCharacters: 15000,
        charactersRemaining: Math.max(
          0,
          15000 - ((usage?.charactersUsed || 0) + (usage?.charactersReserved || 0)),
        ),
      },
    };
  }
}
