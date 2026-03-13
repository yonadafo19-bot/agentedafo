/**
 * Tests setup - Configuración global de tests
 */

import { vi } from 'vitest';

// Mock de console.log para reducir ruido en tests
global.console = {
  ...console,
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

// Mock de process.env
process.env.TELEGRAM_BOT_TOKEN = 'test-token';
process.env.TELEGRAM_ALLOWED_USER_IDS = '123456';
process.env.GROQ_API_KEY = 'test-groq-key';
