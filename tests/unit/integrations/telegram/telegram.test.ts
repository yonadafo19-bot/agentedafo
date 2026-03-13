/**
 * Tests para Telegram Integration
 */

import { describe, it, expect } from 'vitest';

describe('Telegram Integration', () => {
  describe('module exports', () => {
    it('should export TelegramBot class', async () => {
      const telegramModule = await import('../../../../../../src/integrations/telegram/index.ts');
      expect(telegramModule.TelegramBot).toBeDefined();
      expect(typeof telegramModule.TelegramBot).toBe('function');
    });
  });

  describe('TelegramBot class structure', () => {
    it('should have start method as part of the class', async () => {
      const { TelegramBot } = await import('../../../../../../src/integrations/telegram/index.ts');
      expect(TelegramBot.prototype.start).toBeDefined();
      expect(typeof TelegramBot.prototype.start).toBe('function');
    });
  });
});
