/**
 * Tests para utilidades de fecha
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatDate, isToday, addDays } from '../../../../src/shared/utils/date.ts';

describe('formatDate', () => {
  it('should format date correctly', () => {
    const date = new Date('2024-03-15T10:30:00Z');
    const formatted = formatDate(date);
    // Uses es-ES format: DD/MM/YYYY, HH:MM:SS
    expect(formatted).toMatch(/\d{2}\/\d{2}\/\d{4}/);
  });

  it('should format date with custom format', () => {
    const date = new Date('2024-03-15T10:30:00Z');
    const formatted = formatDate(date, 'DD/MM/YYYY');
    expect(formatted).toMatch(/\d{2}\/\d{2}\/\d{4}/);
  });

  it('should handle string date input', () => {
    const formatted = formatDate('2024-03-15');
    expect(formatted).toMatch(/\d{2}\/\d{2}\/\d{4}/);
  });
});

describe('isToday', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return true for today', () => {
    const now = new Date('2024-03-15T12:00:00Z');
    vi.setSystemTime(now);
    expect(isToday(now)).toBe(true);
  });

  it('should return false for yesterday', () => {
    const now = new Date('2024-03-15T12:00:00Z');
    const yesterday = new Date('2024-03-14T12:00:00Z');
    vi.setSystemTime(now);
    expect(isToday(yesterday)).toBe(false);
  });

  it('should return false for tomorrow', () => {
    const now = new Date('2024-03-15T12:00:00Z');
    const tomorrow = new Date('2024-03-16T12:00:00Z');
    vi.setSystemTime(now);
    expect(isToday(tomorrow)).toBe(false);
  });
});

describe('addDays', () => {
  it('should add days to date', () => {
    const date = new Date('2024-03-15T12:00:00Z');
    const result = addDays(date, 5);
    expect(result.getDate()).toBe(20);
    expect(result.getMonth()).toBe(2); // March
  });

  it('should subtract days when negative', () => {
    const date = new Date('2024-03-15T12:00:00Z');
    const result = addDays(date, -5);
    expect(result.getDate()).toBe(10);
  });

  it('should handle month boundaries', () => {
    const date = new Date('2024-03-31T12:00:00Z');
    const result = addDays(date, 1);
    expect(result.getDate()).toBe(1);
    expect(result.getMonth()).toBe(3); // April
  });

  it('should handle year boundaries', () => {
    const date = new Date('2024-12-31T12:00:00Z');
    const result = addDays(date, 1);
    expect(result.getFullYear()).toBe(2025);
    expect(result.getMonth()).toBe(0); // January
    expect(result.getDate()).toBe(1);
  });
});
