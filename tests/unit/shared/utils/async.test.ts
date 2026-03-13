/**
 * Tests para utilidades asíncronas
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { retry, batch, withTimeout, memoizeAsync } from '../../../../src/shared/utils/async.ts';

describe('retry', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('should succeed on first attempt', async () => {
    const fn = vi.fn().mockResolvedValue('success');
    const result = await retry(fn, { maxAttempts: 3 });
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should retry on failure', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValue('success');
    
    // Need to use real timers for async retry
    vi.useRealTimers();
    const result = await retry(fn, { maxAttempts: 3, delayMs: 10 });
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should throw after max attempts', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('fail'));
    vi.useRealTimers();
    await expect(retry(fn, { maxAttempts: 2, delayMs: 10 }))
      .rejects.toThrow('fail');
    expect(fn).toHaveBeenCalledTimes(2);
  });
});

describe('batch', () => {
  it('should process items in batches', async () => {
    const fn = vi.fn((x: number) => Promise.resolve(x * 2));
    const items = [1, 2, 3, 4, 5];
    const results = await batch(items, 2, fn);
    expect(results).toEqual([2, 4, 6, 8, 10]);
    expect(fn).toHaveBeenCalledTimes(5);
  });

  it('should handle empty array', async () => {
    const fn = vi.fn();
    const results = await batch([], 2, fn);
    expect(results).toEqual([]);
    expect(fn).not.toHaveBeenCalled();
  });
});

describe('withTimeout', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('should resolve before timeout', async () => {
    const fn = vi.fn().mockResolvedValue('success');
    const promise = withTimeout(fn(), 1000);
    vi.advanceTimersByTime(100);
    await expect(promise).resolves.toBe('success');
  });

  it('should throw after timeout', async () => {
    const fn = vi.fn().mockImplementation(() => new Promise(() => {})); // Never resolves
    const promise = withTimeout(fn(), 100);
    vi.advanceTimersByTime(150);
    await expect(promise).rejects.toThrow('Operation timed out');
  });
});

describe('memoizeAsync', () => {
  it('should cache results', async () => {
    let count = 0;
    const fn = vi.fn((x: number) => Promise.resolve(x * 2 + count++));
    const memoized = memoizeAsync(fn);

    expect(await memoized(5)).toBe(10);
    expect(await memoized(5)).toBe(10); // Cached
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should handle different arguments separately', async () => {
    const fn = vi.fn((x: number) => Promise.resolve(x * 2));
    const memoized = memoizeAsync(fn);

    await memoized(5);
    await memoized(3);
    await memoized(5);

    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should create separate cache entries for each argument', async () => {
    const fn = vi.fn((x: number) => Promise.resolve(x * 2));
    const memoized = memoizeAsync(fn);

    await memoized(1);
    await memoized(2);
    await memoized(3);

    expect(fn).toHaveBeenCalledTimes(3);
  });
});
