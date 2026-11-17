import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HttpException } from '@nestjs/common';
import { UsageService } from './usage.service';
import { PrismaService } from '../prisma/prisma.service';

describe('UsageService', () => {
  let service: UsageService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsageService,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => {
              if (key === 'serverPepperKey') return 'test_pepper_key';
              if (key === 'hmacKeyCurrentVersion') return 'v1';
              if (key === 'dailyGuestGlobalCharLimit') return 25000;
              if (key === 'monthlyUserCharAllowance') return 15000;
              if (key === 'guestSingleScanCharLimit') return 3000;
              if (key === 'guestDailyCharLimit') return 6000;
              if (key === 'registeredSingleScanCharLimit') return 6000;
              return null;
            },
          },
        },
        {
          provide: PrismaService,
          useValue: {
            $transaction: jest.fn(),
            userUsage: {
              findUnique: jest.fn(),
            },
            guestRateLimit: {
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<UsageService>(UsageService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should hash IP deterministically using HMAC-SHA256', () => {
    const hash1 = service.hashIp('192.168.1.100');
    const hash2 = service.hashIp('192.168.1.100');
    const hashOther = service.hashIp('192.168.1.101');

    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(hashOther);
    expect(hash1).toHaveLength(64); // 32-byte hex
  });

  it('should format periodKey as YYYY-MM', () => {
    const periodKey = service.getCurrentPeriodKey();
    expect(periodKey).toMatch(/^\d{4}-\d{2}$/);
  });

  it('should reject guest scans exceeding 3,000 characters', async () => {
    await expect(service.reserveGuestUsage('1.2.3.4', 3001)).rejects.toThrow(
      HttpException,
    );
  });

  it('should calculate remaining characters correctly for registered user', async () => {
    jest.spyOn(prisma.userUsage, 'findUnique').mockResolvedValueOnce({
      id: 'usage-1',
      userId: 'user-123',
      periodKey: service.getCurrentPeriodKey(),
      charactersUsed: 5000,
      charactersReserved: 2000,
      updatedAt: new Date(),
    });

    const usage = await service.getUserUsage('user-123');
    expect(usage.charactersUsed).toBe(5000);
    expect(usage.charactersReserved).toBe(2000);
    expect(usage.monthlyAllowanceCharacters).toBe(15000);
    expect(usage.charactersRemaining).toBe(8000); // 15000 - 7000
  });
});
