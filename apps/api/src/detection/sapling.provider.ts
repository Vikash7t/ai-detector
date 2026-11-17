import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CategoricalVerdict,
  NormalizedDetectionResult,
  SaplingRawResponse,
} from '@ai-detector/shared-types';
import {
  DetectionProvider,
  DetectionRequest,
} from './detection.provider.interface';
import {
  ProviderRateLimitException,
  ProviderTimeoutException,
  ProviderUnavailableException,
} from './detection.errors';
import {
  alignSentenceOffsets,
  countCodePoints,
  countWords,
  sanitizeInputText,
} from './utils/unicode-text.util';

@Injectable()
export class SaplingProvider implements DetectionProvider {
  public readonly name = 'SAPLING';
  private readonly logger = new Logger(SaplingProvider.name);
  private readonly apiKey: string;
  private readonly apiUrl: string;
  private readonly timeoutMs = 5000;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('saplingApiKey') || '';
    this.apiUrl =
      this.configService.get<string>('saplingApiUrl') ||
      'https://api.sapling.ai/api/v1/aidetect';
  }

  async detectText(request: DetectionRequest): Promise<NormalizedDetectionResult> {
    const sanitizedText = sanitizeInputText(request.text);
    const charCount = countCodePoints(sanitizedText);
    const wordCount = countWords(sanitizedText);

    // If API key is not configured or mock placeholder in local dev, provide deterministic mock for testing
    if (
      !this.apiKey ||
      this.apiKey === 'your_sapling_api_key_here' ||
      this.apiKey.startsWith('mock_')
    ) {
      this.logger.warn(
        'SAPLING_API_KEY is not configured with a live key. Executing simulated mock detection.',
      );
      return this.generateMockResult(sanitizedText, charCount, wordCount);
    }

    const startTime = Date.now();
    let response: Response;

    try {
      response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          text: sanitizedText,
          zero_retention: true,
        }),
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch (err: unknown) {
      const error = err as { name?: string; message?: string };
      const latencyMs = Date.now() - startTime;
      this.logger.error(
        `Sapling network error after ${latencyMs}ms: ${error.message || 'Unknown network error'}`,
      );

      if (error.name === 'TimeoutError' || error.name === 'AbortError') {
        throw new ProviderTimeoutException();
      }
      throw new ProviderUnavailableException();
    }

    const latencyMs = Date.now() - startTime;

    if (!response.ok) {
      const status = response.status;
      this.logger.error(
        `Sapling API returned HTTP ${status} after ${latencyMs}ms`,
      );

      if (status === 401 || status === 403) {
        this.logger.error(
          'CRITICAL: Sapling API key is invalid or unauthorized. Masking error from client.',
        );
        throw new ProviderUnavailableException();
      }

      if (status === 429) {
        throw new ProviderRateLimitException();
      }

      throw new ProviderUnavailableException();
    }

    const data = (await response.json()) as SaplingRawResponse;
    const overallProbability =
      typeof data.score === 'number' && !isNaN(data.score)
        ? Math.max(0, Math.min(1, data.score))
        : 0;

    const aiFraction =
      typeof data.ai_fraction === 'number' && !isNaN(data.ai_fraction)
        ? Math.max(0, Math.min(1, data.ai_fraction))
        : overallProbability;

    let verdict: CategoricalVerdict = 'HUMAN';
    if (overallProbability >= 0.8) {
      verdict = 'AI';
    } else if (overallProbability >= 0.5) {
      verdict = 'INCONCLUSIVE';
    }

    const normalizedSentences = alignSentenceOffsets(
      sanitizedText,
      data.sentence_scores || [],
    );

    return {
      overallProbability,
      aiFraction,
      verdict,
      sentenceScores: normalizedSentences,
      providerName: 'SAPLING',
      providerModelVersion: 'sapling-aidetect-v1',
      latencyMs,
      characterCount: charCount,
      wordCount,
      advisory:
        charCount < 500
          ? 'Short text under 500 characters may yield low statistical confidence.'
          : undefined,
    };
  }

  private generateMockResult(
    text: string,
    characterCount: number,
    wordCount: number,
  ): NormalizedDetectionResult {
    // Generate deterministic mock based on simple heuristic for testing without live credits
    const sentences = text
      .split(/(?<=[.?!])\s+/)
      .filter((s) => s.trim().length > 0);

    const sentenceScores = sentences.map((sentence, idx) => {
      // Deterministic pseudo-probability for mocking
      const score = Math.min(0.95, Math.max(0.05, ((idx * 37) % 100) / 100));
      return {
        sentence,
        score,
      };
    });

    const avgScore =
      sentenceScores.reduce((acc, curr) => acc + curr.score, 0) /
      (sentenceScores.length || 1);

    let verdict: CategoricalVerdict = 'HUMAN';
    if (avgScore >= 0.8) verdict = 'AI';
    else if (avgScore >= 0.5) verdict = 'INCONCLUSIVE';

    const normalizedSentences = alignSentenceOffsets(text, sentenceScores);

    return {
      overallProbability: parseFloat(avgScore.toFixed(3)),
      aiFraction: parseFloat(avgScore.toFixed(3)),
      verdict,
      sentenceScores: normalizedSentences,
      providerName: 'SAPLING',
      providerModelVersion: 'sapling-mock-v1',
      latencyMs: 120,
      characterCount,
      wordCount,
      advisory:
        characterCount < 500
          ? 'Short text under 500 characters may yield low statistical confidence.'
          : undefined,
    };
  }
}
