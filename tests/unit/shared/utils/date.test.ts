/**
 * Tests de utilidades de fecha
 */

import { describe, it, expect } from 'vitest';
import { formatDate, isToday, addDays } from '../../../shared/utils/date.js';

describe('Date Utils', () => {
  it('should format date correctly', () => {
    const date = new Date('2024-03-12T10:30:00');
    const formatted = formatDate(date);

    expect(formatted).toContain('2024');
    expect(formatted).toContain('10:30');
  });

  it('should check if date is today', () => {
    const today = new Date();
    expect(isToday(today)).toBe(true);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    expect(isToday(yesterday)).toBe(false);
  });

  it('should add days to date', () => {
    const date = new Date('2024-03-12');
    const result = addDays(date, 7);

    expect(result.getDate()).toBe(19);
  });
});
