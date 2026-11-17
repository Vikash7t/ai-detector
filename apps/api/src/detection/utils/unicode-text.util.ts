import {
  HighlightSeverity,
  NormalizedSentenceScore,
  SaplingSentenceScore,
} from '@ai-detector/shared-types';

/**
 * Strips null bytes (\0), trims whitespace, and normalizes Unicode to NFC.
 */
export function sanitizeInputText(text: string): string {
  if (!text) return '';
  return text
    .replace(/\0/g, '') // Strip null bytes to prevent PostgreSQL driver errors
    .normalize('NFC')
    .trim();
}

/**
 * Counts words by non-whitespace sequences.
 */
export function countWords(text: string): number {
  if (!text) return 0;
  const matches = text.match(/\S+/g);
  return matches ? matches.length : 0;
}

/**
 * Counts total Unicode code points (handles surrogate pairs, emoji, etc.).
 */
export function countCodePoints(text: string): number {
  if (!text) return 0;
  let count = 0;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  for (const _ of text) {
    count++;
  }
  return count;
}

/**
 * Extracts a substring by Unicode code point indices without allocating
 * a full array for the entire string.
 */
export function sliceByCodePoints(
  text: string,
  startCodePoint: number,
  endCodePoint: number,
): string {
  if (!text || startCodePoint < 0 || endCodePoint <= startCodePoint) {
    return '';
  }

  let currentCodePoint = 0;
  let startIndex = -1;
  let endIndex = -1;
  let byteOffset = 0;

  for (const char of text) {
    if (currentCodePoint === startCodePoint) {
      startIndex = byteOffset;
    }
    if (currentCodePoint === endCodePoint) {
      endIndex = byteOffset;
      break;
    }
    byteOffset += char.length; // 1 for BMP, 2 for surrogate pairs
    currentCodePoint++;
  }

  if (startIndex === -1) {
    return '';
  }
  if (endIndex === -1) {
    endIndex = text.length;
  }

  return text.substring(startIndex, endIndex);
}

/**
 * Maps probability score to categorical highlight severity.
 * - Score >= 0.80 -> RED (High AI probability)
 * - 0.50 <= Score < 0.80 -> YELLOW (Moderate / Mixed)
 * - Score < 0.50 -> NONE (Likely Human)
 */
export function mapScoreToHighlight(score: number): HighlightSeverity {
  if (score >= 0.8) return 'RED';
  if (score >= 0.5) return 'YELLOW';
  return 'NONE';
}

/**
 * Aligns Sapling sentence scores to Unicode offsets in the original text.
 * Falls back to sequential substring search if offsets are absent or invalid.
 */
export function alignSentenceOffsets(
  originalText: string,
  rawSentences: SaplingSentenceScore[],
): NormalizedSentenceScore[] {
  if (!rawSentences || rawSentences.length === 0) {
    return [];
  }

  const totalCodePoints = countCodePoints(originalText);
  let fallbackSearchIndex = 0;

  return rawSentences.map((raw, index) => {
    let charStart = raw.start ?? -1;
    let charEnd = raw.end ?? -1;
    let sentenceText = raw.sentence || '';

    // Validate provider offsets against code point boundaries
    const hasValidOffsets =
      charStart >= 0 &&
      charEnd > charStart &&
      charEnd <= totalCodePoints &&
      charStart < totalCodePoints;

    if (hasValidOffsets) {
      const extracted = sliceByCodePoints(originalText, charStart, charEnd);
      // If extracted text roughly matches the provider sentence (ignoring outer whitespace), keep it
      if (extracted.trim() === sentenceText.trim()) {
        sentenceText = extracted;
      } else {
        // Fall back to substring match if offsets point to mismatched text
        const foundIndex = originalText.indexOf(sentenceText, fallbackSearchIndex);
        if (foundIndex !== -1) {
          charStart = countCodePoints(originalText.substring(0, foundIndex));
          charEnd = charStart + countCodePoints(sentenceText);
          fallbackSearchIndex = foundIndex + sentenceText.length;
        }
      }
    } else {
      // Missing or malformed offsets: sequential search fallback
      const foundIndex = originalText.indexOf(sentenceText, fallbackSearchIndex);
      if (foundIndex !== -1) {
        charStart = countCodePoints(originalText.substring(0, foundIndex));
        charEnd = charStart + countCodePoints(sentenceText);
        fallbackSearchIndex = foundIndex + sentenceText.length;
      } else {
        // If not found in remainder, search from start
        const restartIndex = originalText.indexOf(sentenceText);
        if (restartIndex !== -1) {
          charStart = countCodePoints(originalText.substring(0, restartIndex));
          charEnd = charStart + countCodePoints(sentenceText);
          fallbackSearchIndex = restartIndex + sentenceText.length;
        } else {
          charStart = 0;
          charEnd = 0;
        }
      }
    }

    const safeScore = typeof raw.score === 'number' && !isNaN(raw.score)
      ? Math.max(0, Math.min(1, raw.score))
      : 0;

    return {
      sentenceOrder: index,
      sentenceText,
      charStart,
      charEnd,
      score: safeScore,
      highlightCategory: mapScoreToHighlight(safeScore),
    };
  });
}
