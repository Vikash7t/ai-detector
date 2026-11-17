import {
  Injectable,
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { UserUsageDto, GuestRateLimitStatusDto } from '@ai-detector/shared-types';

@Injectable()
export class UsageService {
  private readonly logger = new Logger(UsageService.name);
  private readonly pepperKey: string;
  private readonly keyVersion: string;
  private readonly dailyGuestGlobalCharLimit: number;
  private readonly monthlyUserCharAllowance: number;
  private readonly guestSingleScanCharLimit: number;
  private readonly guestDailyCharLimit: number;
  private readonly registeredSingleScanCharLimit: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.pepperKey =
      this.configService.get<string>('serverPepperKey') ||
      'development_server_pepper_key_for_hmac_guest_tracking';
    this.keyVersion =
      this.configService.get<string>('hmacKeyCurrentVersion') || 'v1';
    this.dailyGuestGlobalCharLimit =
      this.configService.get<number>('dailyGuestGlobalCharLimit') || 25000;
    this.monthlyUserCharAllowance =
      this.configService.get<number>('monthlyUserCharAllowance') || 15000;
    this.guestSingleScanCharLimit =
      this.configService.get<number>('guestSingleScanCharLimit') || 3000;
    this.guestDailyCharLimit =
      this.configService.get<number>('guestDailyCharLimit') || 6000;
    this.registeredSingleScanCharLimit =
      this.configService.get<number>('registeredSingleScanCharLimit') || 6000;
  }

  /**
   * Hashes a client IP with server pepper using HMAC-SHA256 for privacy-preserving rate limiting.
   */
  hashIp(ip: string): string {
    return crypto
      .createHmac('sha256', this.pepperKey)
      .update(ip || '127.0.0.1')
      .digest('hex');
  }

  getTodayUtcDate(): Date {
    const todayStr = new Date().toISOString().split('T')[0];
    return new Date(`${todayStr}T00:00:00.000Z`);
  }

  getCurrentPeriodKey(): string {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  /**
   * Optimistically reserves guest characters against daily IP cap and global circuit breaker.
   */
  async reserveGuestUsage(ip: string, charCount: number): Promise<string> {
    if (charCount > this.guestSingleScanCharLimit) {
      throw new HttpException(
        `Guest scans are limited to ${this.guestSingleScanCharLimit} characters. Please create an account for longer texts.`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const ipHash = this.hashIp(ip);
    const today = this.getTodayUtcDate();

    // Execute atomic reservation within a single transaction
    await this.prisma.$transaction(async (tx) => {
      // 1. Check & increment GlobalOperationalMetrics
      const globalMetric = await tx.globalOperationalMetrics.upsert({
        where: { date: today },
        create: {
          date: today,
          guestCharactersTotal: charCount,
          registeredCharactersTotal: 0,
        },
        update: {
          guestCharactersTotal: { increment: charCount },
        },
      });

      if (globalMetric.guestCharactersTotal > this.dailyGuestGlobalCharLimit) {
        // Rollback global increment
        await tx.globalOperationalMetrics.update({
          where: { date: today },
          data: { guestCharactersTotal: { decrement: charCount } },
        });
        throw new HttpException(
          'Daily global guest capacity reached. Please create a free account or retry tomorrow.',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      // 2. Check & increment GuestRateLimit
      const guestLimit = await tx.guestRateLimit.upsert({
        where: {
          ipHash_date: {
            ipHash,
            date: today,
          },
        },
        create: {
          ipHash,
          keyVersion: this.keyVersion,
          date: today,
          scanCount: 1,
          charactersAnalyzed: charCount,
        },
        update: {
          scanCount: { increment: 1 },
          charactersAnalyzed: { increment: charCount },
        },
      });

      if (guestLimit.charactersAnalyzed > this.guestDailyCharLimit) {
        // Rollback both increments
        await tx.guestRateLimit.update({
          where: { ipHash_date: { ipHash, date: today } },
          data: {
            scanCount: { decrement: 1 },
            charactersAnalyzed: { decrement: charCount },
          },
        });
        await tx.globalOperationalMetrics.update({
          where: { date: today },
          data: { guestCharactersTotal: { decrement: charCount } },
        });
        throw new HttpException(
          `Guest daily limit reached (${this.guestDailyCharLimit} characters). Sign in for 15,000 free monthly characters.`,
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    });

    return ipHash;
  }

  /**
   * Compensating rollback if external provider call fails for guest scan.
   */
  async releaseGuestUsage(ipHash: string, charCount: number): Promise<void> {
    const today = this.getTodayUtcDate();
    try {
      await this.prisma.$transaction([
        this.prisma.globalOperationalMetrics.update({
          where: { date: today },
          data: { guestCharactersTotal: { decrement: charCount } },
        }),
        this.prisma.guestRateLimit.update({
          where: { ipHash_date: { ipHash, date: today } },
          data: {
            scanCount: { decrement: 1 },
            charactersAnalyzed: { decrement: charCount },
          },
        }),
      ]);
    } catch (err: unknown) {
      this.logger.error(
        `Failed to execute compensating rollback for guest ${ipHash}: ${(err as Error).message}`,
      );
    }
  }

  /**
   * Reserves characters for a registered user within an atomic transaction.
   */
  async reserveUserCharacters(
    tx: Parameters<Parameters<typeof this.prisma.$transaction>[0]>[0],
    userId: string,
    charCount: number,
  ): Promise<{ periodKey: string }> {
    if (charCount > this.registeredSingleScanCharLimit) {
      throw new HttpException(
        `Scan exceeds maximum allowed size (${this.registeredSingleScanCharLimit} characters).`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const periodKey = this.getCurrentPeriodKey();

    // Ensure usage row exists for this period
    await tx.userUsage.upsert({
      where: { userId_periodKey: { userId, periodKey } },
      create: {
        userId,
        periodKey,
        charactersUsed: 0,
        charactersReserved: 0,
      },
      update: {},
    });

    // Atomic conditional reservation update
    const updatedCount = await tx.$executeRaw`
      UPDATE "UserUsage"
      SET "charactersReserved" = "charactersReserved" + ${charCount},
          "updatedAt" = NOW()
      WHERE "userId" = ${userId}
        AND "periodKey" = ${periodKey}
        AND ("charactersUsed" + "charactersReserved" + ${charCount}) <= ${this.monthlyUserCharAllowance};
    `;

    if (updatedCount === 0) {
      throw new HttpException(
        `Monthly operational allowance reached (${this.monthlyUserCharAllowance} characters).`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return { periodKey };
  }

  /**
   * Commits reserved characters upon successful scan completion.
   * Uses conditional status update to prevent double-charging or race conditions with crash recovery.
   */
  async commitUserReservation(
    tx: Parameters<Parameters<typeof this.prisma.$transaction>[0]>[0],
    reservationId: string,
    userId: string,
    periodKey: string,
    charCount: number,
  ): Promise<boolean> {
    const updatedCount = await tx.$executeRaw`
      UPDATE "ScanReservation"
      SET "status" = 'COMMITTED',
          "updatedAt" = NOW()
      WHERE "id" = ${reservationId}
        AND "status" = 'RESERVED';
    `;

    if (updatedCount === 0) {
      this.logger.warn(
        `Reservation ${reservationId} was not in RESERVED status (likely already released by crash recovery). Dropping settlement.`,
      );
      return false;
    }

    await tx.$executeRaw`
      UPDATE "UserUsage"
      SET "charactersUsed" = "charactersUsed" + ${charCount},
          "charactersReserved" = GREATEST(0, "charactersReserved" - ${charCount}),
          "updatedAt" = NOW()
      WHERE "userId" = ${userId}
        AND "periodKey" = ${periodKey};
    `;

    return true;
  }

  /**
   * Releases reserved characters upon provider failure or timeout.
   */
  async releaseUserReservation(
    tx: Parameters<Parameters<typeof this.prisma.$transaction>[0]>[0],
    reservationId: string,
    userId: string,
    periodKey: string,
    charCount: number,
  ): Promise<boolean> {
    const updatedCount = await tx.$executeRaw`
      UPDATE "ScanReservation"
      SET "status" = 'RELEASED',
          "updatedAt" = NOW()
      WHERE "id" = ${reservationId}
        AND "status" = 'RESERVED';
    `;

    if (updatedCount === 0) {
      return false;
    }

    await tx.$executeRaw`
      UPDATE "UserUsage"
      SET "charactersReserved" = GREATEST(0, "charactersReserved" - ${charCount}),
          "updatedAt" = NOW()
      WHERE "userId" = ${userId}
        AND "periodKey" = ${periodKey};
    `;

    return true;
  }

  /**
   * Retrieves usage summary for the current user.
   */
  async getUserUsage(userId: string): Promise<UserUsageDto> {
    const periodKey = this.getCurrentPeriodKey();
    const usage = await this.prisma.userUsage.findUnique({
      where: { userId_periodKey: { userId, periodKey } },
    });

    const used = usage?.charactersUsed ?? 0;
    const reserved = usage?.charactersReserved ?? 0;
    const remaining = Math.max(
      0,
      this.monthlyUserCharAllowance - (used + reserved),
    );

    return {
      periodKey,
      charactersUsed: used,
      charactersReserved: reserved,
      monthlyAllowanceCharacters: this.monthlyUserCharAllowance,
      charactersRemaining: remaining,
    };
  }

  /**
   * Retrieves rate limit status for guest IP.
   */
  async getGuestRateLimitStatus(ip: string): Promise<GuestRateLimitStatusDto> {
    const ipHash = this.hashIp(ip);
    const today = this.getTodayUtcDate();
    const record = await this.prisma.guestRateLimit.findUnique({
      where: { ipHash_date: { ipHash, date: today } },
    });

    const used = record?.charactersAnalyzed ?? 0;
    return {
      date: today.toISOString().split('T')[0],
      scansPerformed: record?.scanCount ?? 0,
      charactersUsed: used,
      dailyAllowanceCharacters: this.guestDailyCharLimit,
    };
  }
}
