import {
  Injectable,
  Inject,
  Logger,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import {
  DETECTION_PROVIDER,
  DetectionProvider,
} from '../detection/detection.provider.interface';
import { UsageService } from '../usage/usage.service';
import { CreateScanDto } from './dto/create-scan.dto';
import {
  NormalizedDetectionResult,
  ScanDetailDto,
  ScanSummaryDto,
} from '@ai-detector/shared-types';
import {
  countCodePoints,
  countWords,
  sanitizeInputText,
} from '../detection/utils/unicode-text.util';

@Injectable()
export class ScanService {
  private readonly logger = new Logger(ScanService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly usageService: UsageService,
    @Inject(DETECTION_PROVIDER)
    private readonly detectionProvider: DetectionProvider,
  ) {}

  /**
   * 100% ephemeral guest scan: in-memory execution, zero database scan records written.
   */
  async executeGuestScan(
    clientIp: string,
    rawText: string,
  ): Promise<NormalizedDetectionResult> {
    const text = sanitizeInputText(rawText);
    const charCount = countCodePoints(text);
    const wordCount = countWords(text);

    if (charCount < 300) {
      throw new BadRequestException(
        'Text must be at least 300 characters for reliable statistical detection.',
      );
    }
    if (charCount > 3000) {
      throw new BadRequestException(
        'Anonymous guest scans are capped at 3,000 characters. Please sign in for higher limits.',
      );
    }

    // 1. Optimistic rate limit reservation
    const ipHash = await this.usageService.reserveGuestUsage(clientIp, charCount);

    try {
      // 2. External detection call
      const result = await this.detectionProvider.detectText({ text });
      return result;
    } catch (err: unknown) {
      // 3. Compensating rollback on failure
      await this.usageService.releaseGuestUsage(ipHash, charCount);
      throw err;
    }
  }

  /**
   * Registered user scan with two-phase lock-free reservation and idempotency guards.
   */
  async executeUserScan(
    userId: string,
    dto: CreateScanDto,
  ): Promise<ScanDetailDto> {
    const text = sanitizeInputText(dto.text);
    const charCount = countCodePoints(text);
    const wordCount = countWords(text);

    if (charCount < 300) {
      throw new BadRequestException(
        'Text must be at least 300 characters for reliable statistical detection.',
      );
    }
    if (charCount > 6000) {
      throw new BadRequestException(
        'Text exceeds maximum allowed size (6,000 characters).',
      );
    }

    const payloadHash = crypto.createHash('sha256').update(text).digest('hex');

    // 1. Idempotency check if idempotencyKey is provided
    if (dto.idempotencyKey) {
      const existingScan = await this.prisma.scan.findUnique({
        where: {
          userId_idempotencyKey: {
            userId,
            idempotencyKey: dto.idempotencyKey,
          },
        },
        include: {
          result: true,
          sentences: { orderBy: { sentenceOrder: 'asc' } },
        },
      });

      if (existingScan) {
        if (existingScan.payloadHash !== payloadHash) {
          throw new ConflictException(
            'Idempotency key was previously used with a different text payload.',
          );
        }
        return this.formatScanDetail(existingScan);
      }
    }

    // 2. Phase 1: Atomic Database Reservation (Connection held briefly)
    const { scan, reservation, periodKey } = await this.prisma.$transaction(
      async (tx) => {
        // Reserve characters in UserUsage
        const { periodKey: pKey } =
          await this.usageService.reserveUserCharacters(tx, userId, charCount);

        // Insert pending Scan
        const newScan = await tx.scan.create({
          data: {
            userId,
            idempotencyKey: dto.idempotencyKey || null,
            payloadHash,
            submittedText: text,
            wordCount,
            characterCount: charCount,
            status: 'PENDING',
          },
        });

        // Insert ScanReservation record
        const newRes = await tx.scanReservation.create({
          data: {
            scanId: newScan.id,
            userId,
            periodKey: pKey,
            charactersReserved: charCount,
            status: 'RESERVED',
          },
        });

        return { scan: newScan, reservation: newRes, periodKey: pKey };
      },
    );

    // 3. External API Call (Held outside any DB transaction to protect DB connection pool)
    let detectionResult: NormalizedDetectionResult;
    try {
      detectionResult = await this.detectionProvider.detectText({ text });
    } catch (providerError: unknown) {
      const err = providerError as Error;
      this.logger.error(`Detection provider failed for scan ${scan.id}: ${err.message}`);

      // Handle failure settlement: release characters and mark scan FAILED
      await this.prisma.$transaction(async (tx) => {
        await this.usageService.releaseUserReservation(
          tx,
          reservation.id,
          userId,
          periodKey,
          charCount,
        );

        await tx.scan.update({
          where: { id: scan.id },
          data: {
            status: 'FAILED',
            errorCode: err.name || 'PROVIDER_ERROR',
            completedAt: new Date(),
          },
        });

        await tx.scanProviderAttempt.create({
          data: {
            scanId: scan.id,
            provider: 'SAPLING',
            attemptNumber: 1,
            latencyMs: 0,
            errorCode: err.name || 'PROVIDER_ERROR',
          },
        });
      });

      throw providerError;
    }

    // 4. Phase 2: Atomic Settlement Transaction
    const completedScan = await this.prisma.$transaction(async (tx) => {
      // Commit reservation conditionally
      const committed = await this.usageService.commitUserReservation(
        tx,
        reservation.id,
        userId,
        periodKey,
        charCount,
      );

      if (!committed) {
        throw new ConflictException(
          'Analysis timed out or was already reclaimed by system crash recovery.',
        );
      }

      // Insert ScanResult (omitting duplicate full text)
      const scanResult = await tx.scanResult.create({
        data: {
          scanId: scan.id,
          providerScore: detectionResult.overallProbability,
          aiFraction: detectionResult.aiFraction,
          providerVerdict: detectionResult.verdict,
          latencyMs: detectionResult.latencyMs,
          rawResponse: {
            overallProbability: detectionResult.overallProbability,
            aiFraction: detectionResult.aiFraction,
            verdict: detectionResult.verdict,
            providerModelVersion: detectionResult.providerModelVersion,
          },
        },
      });

      // Insert sentence scores
      if (detectionResult.sentenceScores.length > 0) {
        await tx.sentenceScore.createMany({
          data: detectionResult.sentenceScores.map((s) => ({
            scanId: scan.id,
            sentenceOrder: s.sentenceOrder,
            charStart: s.charStart,
            charEnd: s.charEnd,
            sentenceText: s.sentenceText,
            score: s.score,
          })),
        });
      }

      // Update Scan to COMPLETED
      const finalScan = await tx.scan.update({
        where: { id: scan.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
        include: {
          result: true,
          sentences: { orderBy: { sentenceOrder: 'asc' } },
        },
      });

      return finalScan;
    });

    return this.formatScanDetail(completedScan);
  }

  /**
   * Retrieves paginated scan history for the current user.
   */
  async getUserScans(
    userId: string,
    page = 1,
    limit = 20,
  ): Promise<{ scans: ScanSummaryDto[]; total: number }> {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(50, Math.max(1, limit));
    const skip = (safePage - 1) * safeLimit;

    const [total, scans] = await this.prisma.$transaction([
      this.prisma.scan.count({ where: { userId } }),
      this.prisma.scan.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: safeLimit,
        include: {
          result: {
            select: {
              providerScore: true,
              providerVerdict: true,
            },
          },
        },
      }),
    ]);

    const formattedScans: ScanSummaryDto[] = scans.map((s) => ({
      id: s.id,
      snippet:
        s.submittedText.length > 120
          ? `${s.submittedText.substring(0, 120)}...`
          : s.submittedText,
      wordCount: s.wordCount,
      characterCount: s.characterCount,
      overallProbability: s.result?.providerScore ?? null,
      verdict: s.result?.providerVerdict ?? null,
      status: s.status as ScanSummaryDto['status'],
      createdAt: s.createdAt.toISOString(),
    }));

    return { scans: formattedScans, total };
  }

  /**
   * Retrieves full details of a specific scan, strictly validating user ownership.
   */
  async getScanById(userId: string, scanId: string): Promise<ScanDetailDto> {
    const scan = await this.prisma.scan.findFirst({
      where: {
        id: scanId,
        userId, // Strict IDOR protection
      },
      include: {
        result: true,
        sentences: { orderBy: { sentenceOrder: 'asc' } },
      },
    });

    if (!scan) {
      throw new NotFoundException(`Scan ${scanId} not found.`);
    }

    return this.formatScanDetail(scan);
  }

  /**
   * Cascade-deletes a scan. Rejects scans currently in PENDING status.
   */
  async deleteScan(userId: string, scanId: string): Promise<void> {
    const scan = await this.prisma.scan.findFirst({
      where: {
        id: scanId,
        userId,
      },
    });

    if (!scan) {
      throw new NotFoundException(`Scan ${scanId} not found.`);
    }

    if (scan.status === 'PENDING') {
      throw new ConflictException(
        'Cannot delete a scan while analysis is currently in progress.',
      );
    }

    await this.prisma.scan.deleteMany({
      where: {
        id: scanId,
        userId,
      },
    });
  }

  private formatScanDetail(scan: any): ScanDetailDto {
    let resultPayload: NormalizedDetectionResult | null = null;

    if (scan.result) {
      resultPayload = {
        overallProbability: scan.result.providerScore,
        aiFraction: scan.result.aiFraction,
        verdict: scan.result.providerVerdict,
        sentenceScores: (scan.sentences || []).map((s: any) => ({
          sentenceOrder: s.sentenceOrder,
          sentenceText: s.sentenceText,
          charStart: s.charStart,
          charEnd: s.charEnd,
          score: s.score,
          highlightCategory:
            s.score >= 0.8 ? 'RED' : s.score >= 0.5 ? 'YELLOW' : 'NONE',
        })),
        providerName: 'SAPLING',
        providerModelVersion: 'sapling-aidetect-v1',
        latencyMs: scan.result.latencyMs,
        characterCount: scan.characterCount,
        wordCount: scan.wordCount,
      };
    }

    return {
      id: scan.id,
      userId: scan.userId,
      submittedText: scan.submittedText,
      wordCount: scan.wordCount,
      characterCount: scan.characterCount,
      status: scan.status,
      errorCode: scan.errorCode,
      createdAt: scan.createdAt.toISOString(),
      completedAt: scan.completedAt ? scan.completedAt.toISOString() : null,
      result: resultPayload,
    };
  }
}
