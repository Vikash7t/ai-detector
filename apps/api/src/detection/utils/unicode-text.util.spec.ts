import {
  sanitizeInputText,
  countWords,
  countCodePoints,
  sliceByCodePoints,
  mapScoreToHighlight,
  alignSentenceOffsets,
} from './unicode-text.util';

describe('UnicodeTextUtil', () => {
  describe('sanitizeInputText', () => {
    it('should strip null bytes and trim whitespace', () => {
      const dirty = '  Hello\0 world!\0  ';
      expect(sanitizeInputText(dirty)).toBe('Hello world!');
    });

    it('should normalize Unicode to NFC', () => {
      // Combining character e + acute accent -> single code point é in NFC
      const decomposed = 'e\u0301cole';
      const sanitized = sanitizeInputText(decomposed);
      expect(sanitized).toBe('école');
      expect(sanitized.length).toBe(5);
    });

    it('should return empty string for null or empty input', () => {
      expect(sanitizeInputText('')).toBe('');
    });
  });

  describe('countWords', () => {
    it('should count words separated by spaces, tabs, and newlines', () => {
      const text = 'This is a   test\nwith multiple\tlines.';
      expect(countWords(text)).toBe(7);
    });

    it('should return 0 for empty or whitespace-only text', () => {
      expect(countWords('')).toBe(0);
      expect(countWords('   \n\t  ')).toBe(0);
    });
  });

  describe('countCodePoints & sliceByCodePoints', () => {
    it('should count code points correctly with emojis (surrogate pairs)', () => {
      const text = 'Hello 🚀 World';
      // '🚀' has length 2 in UTF-16 (code units), but is 1 code point
      expect(text.length).toBe(14);
      expect(countCodePoints(text)).toBe(13);
    });

    it('should accurately slice text using code point indices', () => {
      const text = 'Hello 🚀 World';
      // Slicing code points 6 to 7 should extract just '🚀'
      const emoji = sliceByCodePoints(text, 6, 7);
      expect(emoji).toBe('🚀');

      const world = sliceByCodePoints(text, 8, 13);
      expect(world).toBe('World');
    });

    it('should handle boundary conditions safely', () => {
      const text = 'Test';
      expect(sliceByCodePoints(text, -1, 2)).toBe('');
      expect(sliceByCodePoints(text, 2, 2)).toBe('');
      expect(sliceByCodePoints(text, 0, 10)).toBe('Test');
    });
  });

  describe('mapScoreToHighlight', () => {
    it('should return RED for score >= 0.8', () => {
      expect(mapScoreToHighlight(0.8)).toBe('RED');
      expect(mapScoreToHighlight(0.95)).toBe('RED');
    });

    it('should return YELLOW for 0.5 <= score < 0.8', () => {
      expect(mapScoreToHighlight(0.5)).toBe('YELLOW');
      expect(mapScoreToHighlight(0.79)).toBe('YELLOW');
    });

    it('should return NONE for score < 0.5', () => {
      expect(mapScoreToHighlight(0.49)).toBe('NONE');
      expect(mapScoreToHighlight(0.0)).toBe('NONE');
    });
  });

  describe('alignSentenceOffsets', () => {
    it('should align sentences when valid provider offsets are present', () => {
      const original = 'First sentence here. Second sentence starts.';
      const raw = [
        { sentence: 'First sentence here.', score: 0.85, start: 0, end: 20 },
        { sentence: 'Second sentence starts.', score: 0.12, start: 21, end: 44 },
      ];

      const result = alignSentenceOffsets(original, raw);
      expect(result).toHaveLength(2);
      expect(result[0].highlightCategory).toBe('RED');
      expect(result[0].charStart).toBe(0);
      expect(result[0].charEnd).toBe(20);
      expect(result[1].highlightCategory).toBe('NONE');
      expect(result[1].charStart).toBe(21);
      expect(result[1].charEnd).toBe(44);
    });

    it('should fall back to substring search when offsets are missing', () => {
      const original = 'One. Two. Three.';
      const raw = [
        { sentence: 'One.', score: 0.9 },
        { sentence: 'Two.', score: 0.6 },
        { sentence: 'Three.', score: 0.1 },
      ];

      const result = alignSentenceOffsets(original, raw);
      expect(result).toHaveLength(3);
      expect(result[0].charStart).toBe(0);
      expect(result[0].charEnd).toBe(4);
      expect(result[1].charStart).toBe(5);
      expect(result[1].charEnd).toBe(9);
      expect(result[2].charStart).toBe(10);
      expect(result[2].charEnd).toBe(16);
    });
  });
});
