/**
 * Tests de async utilities
 */

import { describe, it, expect, vi } from 'vitest';
import { retry, sleep } from '../../../shared/utils/async.js';

describe('Async Utils', () => {
  describe('sleep', () => {
    it('should sleep for specified time', async () => {
      const start = Date.now();
      await sleep(100);
      const elapsed = Date.now() - start;

      expect(elapsed).toBeGreaterThanOrEqual(100);
    });
  });

  describe('retry', () => {
    it('should succeed on first try', async () => {
      const fn = vi.fn().mockResolvedValue('success');
      const result = await retry(fn, { maxAttempts: 3 });

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure', async () => {
      let attempts = 0;
      const fn = vi.fn().mockImplementation(() => {
        attempts++;
        if (attempts < 3) throw new Error('Failed');
        return 'success';
      });

      const result = await retry(fn, { maxAttempts: 3, delayMs: 10 });

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should fail after max attempts', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('Always fails'));

      await expect(
        retry(fn, { maxAttempts: 2, delayMs: 1 })
      ).rejects.toThrow('Always fails');

      expect(fn).toHaveBeenCalledTimes(2);
    });
  });
});
