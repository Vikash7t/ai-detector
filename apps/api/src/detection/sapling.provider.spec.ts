import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SaplingProvider } from './sapling.provider';
import {
  ProviderRateLimitException,
  ProviderTimeoutException,
  ProviderUnavailableException,
} from './detection.errors';

describe('SaplingProvider', () => {
  let provider: SaplingProvider;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SaplingProvider,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => {
              if (key === 'saplingApiKey') return 'test_live_key_123';
              if (key === 'saplingApiUrl') return 'https://api.sapling.ai/api/v1/aidetect';
              return null;
            },
          },
        },
      ],
    }).compile();

    provider = module.get<SaplingProvider>(SaplingProvider);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should call Sapling API with zero_retention: true and Bearer token', async () => {
    const mockResponseData = {
      score: 0.92,
      ai_fraction: 0.92,
      verdict: 'AI',
      sentence_scores: [
        {
          sentence: 'This is an AI generated sentence.',
          score: 0.95,
          start: 0,
          end: 33,
        },
      ],
      text: 'This is an AI generated sentence.',
    };

    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockResponseData,
    } as Response);

    const result = await provider.detectText({
      text: 'This is an AI generated sentence.',
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, options] = fetchSpy.mock.calls[0];
    expect(url).toBe('https://api.sapling.ai/api/v1/aidetect');
    expect(options?.headers).toMatchObject({
      Authorization: 'Bearer test_live_key_123',
      'Content-Type': 'application/json',
    });

    const parsedBody = JSON.parse(options?.body as string);
    expect(parsedBody.zero_retention).toBe(true);
    expect(parsedBody.text).toBe('This is an AI generated sentence.');

    expect(result.verdict).toBe('AI');
    expect(result.overallProbability).toBe(0.92);
    expect(result.sentenceScores).toHaveLength(1);
    expect(result.sentenceScores[0].highlightCategory).toBe('RED');
  });

  it('should mask HTTP 401 as ProviderUnavailableException without leaking keys', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
    } as Response);

    await expect(
      provider.detectText({ text: 'Some sample text for detection.' }),
    ).rejects.toThrow(ProviderUnavailableException);
  });

  it('should throw ProviderRateLimitException on HTTP 429', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 429,
      statusText: 'Too Many Requests',
    } as Response);

    await expect(
      provider.detectText({ text: 'Some sample text for detection.' }),
    ).rejects.toThrow(ProviderRateLimitException);
  });

  it('should throw ProviderTimeoutException when fetch is aborted on timeout', async () => {
    const timeoutErr = new Error('The operation was aborted due to timeout');
    timeoutErr.name = 'TimeoutError';

    jest.spyOn(global, 'fetch').mockRejectedValueOnce(timeoutErr);

    await expect(
      provider.detectText({ text: 'Some sample text for detection.' }),
    ).rejects.toThrow(ProviderTimeoutException);
  });
});
