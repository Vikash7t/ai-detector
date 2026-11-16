import { NormalizedDetectionResult } from './detection.js';

export type ScanStatus = 'PENDING' | 'COMPLETED' | 'FAILED';

export type ScanErrorCode =
  | 'TIMEOUT'
  | 'PROVIDER_5XX'
  | 'RATE_LIMITED'
  | 'VALIDATION_ERROR'
  | 'BACKEND_TIMEOUT_OR_CRASH'
  | 'INTERNAL_ERROR';

export interface CreateScanDto {
  text: string;
}

export interface ScanDetailDto {
  id: string;
  userId: string;
  submittedText: string;
  wordCount: number;
  characterCount: number;
  status: ScanStatus;
  errorCode?: string | null;
  createdAt: string;
  completedAt?: string | null;
  result?: NormalizedDetectionResult | null;
}

export interface ScanSummaryDto {
  id: string;
  snippet: string;
  wordCount: number;
  characterCount: number;
  overallProbability?: number | null;
  verdict?: string | null;
  status: ScanStatus;
  createdAt: string;
}
