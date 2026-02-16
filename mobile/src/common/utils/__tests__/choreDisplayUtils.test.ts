/**
 * Tests for choreDisplayUtils
 * 
 * Validates date/time formatting utility functions for chore display
 */

import { formatChoreDueDateTime } from '../choreDisplayUtils';

describe('choreDisplayUtils', () => {
  describe('formatChoreDueDateTime', () => {
    describe.each([
      ['date and time', 'Feb 16, 2026', '6:00 PM', 'Feb 16, 2026 · 6:00 PM'],
      ['date only', 'Feb 16, 2026', undefined, 'Feb 16, 2026'],
      ['empty time string', 'Feb 16, 2026', '', 'Feb 16, 2026'],
      ['long date format', 'February 16, 2026', '11:59 PM', 'February 16, 2026 · 11:59 PM'],
      ['short date format', 'Feb 16', '6:00 PM', 'Feb 16 · 6:00 PM'],
      ['12-hour time format', 'Feb 16', '6:00 PM', 'Feb 16 · 6:00 PM'],
      ['24-hour time format', 'Feb 16', '18:00', 'Feb 16 · 18:00'],
      ['time with seconds', 'Feb 16', '6:00:00 PM', 'Feb 16 · 6:00:00 PM'],
    ])('with %s', (scenario, dueDate, dueTime, expected) => {
      it(`should return "${expected}"`, () => {
        const result = formatChoreDueDateTime(dueDate, dueTime);
        expect(result).toBe(expected);
      });
    });

    describe('edge cases', () => {
      it('should handle whitespace in date', () => {
        expect(formatChoreDueDateTime('  Feb 16  ', '6:00 PM')).toBe('  Feb 16   · 6:00 PM');
      });

      it('should handle whitespace in time', () => {
        expect(formatChoreDueDateTime('Feb 16', '  6:00 PM  ')).toBe('Feb 16 ·   6:00 PM  ');
      });

      it('should handle special characters in date', () => {
        expect(formatChoreDueDateTime('Feb 16, 2026', '6:00 PM')).toBe('Feb 16, 2026 · 6:00 PM');
      });

      it('should use middle dot separator consistently', () => {
        const result = formatChoreDueDateTime('Feb 16', '6:00 PM');
        expect(result).toContain('·');
        expect(result).toMatch(/\s·\s/); // Middle dot with spaces
      });
    });

    describe('return value validation', () => {
      it('should always return a string', () => {
        expect(typeof formatChoreDueDateTime('Feb 16', '6:00 PM')).toBe('string');
        expect(typeof formatChoreDueDateTime('Feb 16', undefined)).toBe('string');
        expect(typeof formatChoreDueDateTime('Feb 16')).toBe('string');
      });

      it('should not return empty string when date is provided', () => {
        expect(formatChoreDueDateTime('Feb 16', '6:00 PM')).not.toBe('');
        expect(formatChoreDueDateTime('Feb 16')).not.toBe('');
      });
    });
  });
});
