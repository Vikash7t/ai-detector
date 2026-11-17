import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReconciliationService {
  private readonly logger = new Logger(ReconciliationService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Recovers orphaned ScanReservations older than 90 seconds.
   * Runs every 60 seconds.
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async reconcileOrphanedReservations(): Promise<void> {
    const cutoffTime = new Date(Date.now() - 90 * 1000);

    const orphaned = await this.prisma.scanReservation.findMany({
      where: {
        status: 'RESERVED',
        createdAt: {
          lt: cutoffTime,
        },
      },
      take: 50,
    });

    if (orphaned.length === 0) {
      return;
    }

    this.logger.warn(
      `Found ${orphaned.length} orphaned scan reservations older than 90 seconds. Starting rollback.`,
    );

    for (const res of orphaned) {
      try {
        await this.prisma.$transaction(async (tx) => {
          // Conditional lock and update on reservation
          const updated = await tx.$executeRaw`
            UPDATE "ScanReservation"
            SET "status" = 'RELEASED',
                "updatedAt" = NOW()
            WHERE "id" = ${res.id}
              AND "status" = 'RESERVED';
          `;

          if (updated > 0) {
            // Release reserved characters from user usage
            await tx.$executeRaw`
              UPDATE "UserUsage"
              SET "charactersReserved" = GREATEST(0, "charactersReserved" - ${res.charactersReserved}),
                  "updatedAt" = NOW()
              WHERE "userId" = ${res.userId}
                AND "periodKey" = ${res.periodKey};
            `;

            // Fail the scan record
            await tx.scan.update({
              where: { id: res.scanId },
              data: {
                status: 'FAILED',
                errorCode: 'BACKEND_TIMEOUT_OR_CRASH',
                completedAt: new Date(),
              },
            });

            this.logger.log(
              `Successfully rolled back orphaned reservation ${res.id} for scan ${res.scanId}.`,
            );
          }
        });
      } catch (err: unknown) {
        this.logger.error(
          `Failed to reconcile orphaned reservation ${res.id}: ${(err as Error).message}`,
        );
      }
    }
  }

  /**
   * Purges guest rate limit records older than 48 hours to adhere to data minimization & GDPR.
   * Runs every midnight UTC.
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async purgeExpiredGuestRateLimits(): Promise<void> {
    const cutoff = new Date(Date.now() - 48 * 3600 * 1000);
    try {
      const deleted = await this.prisma.guestRateLimit.deleteMany({
        where: {
          date: {
            lt: cutoff,
          },
        },
      });
      if (deleted.count > 0) {
        this.logger.log(`Purged ${deleted.count} expired guest rate limit records.`);
      }
    } catch (err: unknown) {
      this.logger.error(`Error purging guest rate limits: ${(err as Error).message}`);
    }
  }
}
