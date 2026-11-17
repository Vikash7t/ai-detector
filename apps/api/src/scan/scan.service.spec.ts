import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { ScanService } from './scan.service';
import { PrismaService } from '../prisma/prisma.service';
import { UsageService } from '../usage/usage.service';
import { DETECTION_PROVIDER } from '../detection/detection.provider.interface';

describe('ScanService', () => {
  let service: ScanService;
  let usageService: UsageService;
  let detectionProvider: any;
  let prisma: PrismaService;

  beforeEach(async () => {
    detectionProvider = {
      name: 'SAPLING',
      detectText: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScanService,
        {
          provide: PrismaService,
          useValue: {
            $transaction: jest.fn(),
            scan: {
              findUnique: jest.fn(),
              findFirst: jest.fn(),
              findMany: jest.fn(),
              count: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              deleteMany: jest.fn(),
            },
            scanReservation: {
              create: jest.fn(),
            },
          },
        },
        {
          provide: UsageService,
          useValue: {
            reserveGuestUsage: jest.fn().mockResolvedValue('test_ip_hash'),
            releaseGuestUsage: jest.fn().mockResolvedValue(undefined),
            reserveUserCharacters: jest.fn().mockResolvedValue({ periodKey: '2026-11' }),
            commitUserReservation: jest.fn().mockResolvedValue(true),
            releaseUserReservation: jest.fn().mockResolvedValue(true),
          },
        },
        {
          provide: DETECTION_PROVIDER,
          useValue: detectionProvider,
        },
      ],
    }).compile();

    service = module.get<ScanService>(ScanService);
    usageService = module.get<UsageService>(UsageService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('executeGuestScan', () => {
    it('should reject text under 300 characters', async () => {
      const shortText = 'Too short text.';
      await expect(
        service.executeGuestScan('127.0.0.1', shortText),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject text over 3,000 characters for guests', async () => {
      const longText = 'a'.repeat(3001);
      await expect(
        service.executeGuestScan('127.0.0.1', longText),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reserve guest usage, call provider, and never insert DB scan records', async () => {
      const validText = 'a'.repeat(500);
      const mockResult = {
        overallProbability: 0.1,
        aiFraction: 0.1,
        verdict: 'HUMAN',
        sentenceScores: [],
        providerName: 'SAPLING',
        providerModelVersion: 'sapling-aidetect-v1',
        latencyMs: 150,
        characterCount: 500,
        wordCount: 1,
      };

      detectionProvider.detectText.mockResolvedValueOnce(mockResult);

      const result = await service.executeGuestScan('127.0.0.1', validText);

      expect(usageService.reserveGuestUsage).toHaveBeenCalledTimes(1);
      expect(detectionProvider.detectText).toHaveBeenCalledTimes(1);
      expect(prisma.scan.create).not.toHaveBeenCalled();
      expect(result.verdict).toBe('HUMAN');
    });

    it('should rollback guest usage on provider failure', async () => {
      const validText = 'a'.repeat(500);
      detectionProvider.detectText.mockRejectedValueOnce(new Error('Network error'));

      await expect(
        service.executeGuestScan('127.0.0.1', validText),
      ).rejects.toThrow('Network error');

      expect(usageService.releaseGuestUsage).toHaveBeenCalledWith('test_ip_hash', 500);
    });
  });

  describe('deleteScan', () => {
    it('should reject deletion if scan is in PENDING status', async () => {
      jest.spyOn(prisma.scan, 'findFirst').mockResolvedValueOnce({
        id: 'scan-1',
        userId: 'user-1',
        status: 'PENDING',
      } as any);

      await expect(service.deleteScan('user-1', 'scan-1')).rejects.toThrow(
        ConflictException,
      );
    });

    it('should execute scoped deletion if scan is COMPLETED', async () => {
      jest.spyOn(prisma.scan, 'findFirst').mockResolvedValueOnce({
        id: 'scan-1',
        userId: 'user-1',
        status: 'COMPLETED',
      } as any);

      jest.spyOn(prisma.scan, 'deleteMany').mockResolvedValueOnce({ count: 1 });

      await service.deleteScan('user-1', 'scan-1');

      expect(prisma.scan.deleteMany).toHaveBeenCalledWith({
        where: { id: 'scan-1', userId: 'user-1' },
      });
    });
  });
});
