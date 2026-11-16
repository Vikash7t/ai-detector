export type CategoricalVerdict = 'HUMAN' | 'INCONCLUSIVE' | 'AI';

export type HighlightSeverity = 'RED' | 'YELLOW' | 'NONE';

export interface NormalizedSentenceScore {
  sentenceOrder: number;
  sentenceText: string;
  charStart: number; // Unicode code point index (inclusive)
  charEnd: number;   // Unicode code point index (exclusive)
  score: number;     // 0.0 to 1.0 (Sapling probability)
  highlightCategory: HighlightSeverity;
}

export interface NormalizedDetectionResult {
  overallProbability: number; // 0.0 to 1.0
  aiFraction: number;         // 0.0 to 1.0
  verdict: CategoricalVerdict;
  sentenceScores: NormalizedSentenceScore[];
  providerName: 'SAPLING';
  providerModelVersion: string;
  latencyMs: number;
  characterCount: number;
  wordCount: number;
  advisory?: string;
}

export interface SaplingSentenceScore {
  sentence: string;
  score: number;
  start?: number;
  end?: number;
}

export interface SaplingRawResponse {
  score: number;
  ai_fraction: number;
  verdict: string;
  sentence_scores: SaplingSentenceScore[];
  text: string;
}
