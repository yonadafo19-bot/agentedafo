/**
 * Tests para Memory
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Memory } from '../../../../../../src/core/memory/index.ts';
import { writeFileSync, unlinkSync, existsSync } from 'node:fs';
import { join } from 'node:path';

// Mock de sql.js
vi.mock('sql.js', () => ({
  default: {
    Database: vi.fn().mockImplementation(() => ({
      run: vi.fn(),
      prepare: vi.fn().mockReturnValue({
        bind: vi.fn().mockReturnThis(),
        step: vi.fn().mockReturnValue(false),
        getAsObject: vi.fn().mockReturnValue(undefined),
        free: vi.fn(),
      }),
      export: vi.fn().mockReturnValue(new Uint8Array([])),
      close: vi.fn(),
    })),
  },
}));

const TEST_DB_PATH = join(process.cwd(), 'test-memory.db');

describe('Memory', () => {
  let memory: Memory;

  beforeEach(() => {
    memory = new Memory(TEST_DB_PATH);
  });

  afterEach(() => {
    // Clean up test database
    if (existsSync(TEST_DB_PATH)) {
      unlinkSync(TEST_DB_PATH);
    }
  });

  describe('constructor', () => {
    it('should create memory instance', () => {
      expect(memory).toBeDefined();
    });

    it('should set db path from constructor', () => {
      const testMemory = new Memory('test.db');
      expect(testMemory).toBeDefined();
    });
  });

  describe('close', () => {
    it('should close database without error', () => {
      expect(() => memory.close()).not.toThrow();
    });
  });
});
