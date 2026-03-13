/**
 * Tests para Tools
 */

import { describe, it, expect } from 'vitest';

describe('Tools System', () => {
  describe('getTool', () => {
    it('should be importable from tools module', async () => {
      const toolsModule = await import('../../../../../../src/core/tools/index.ts');
      expect(toolsModule.getTool).toBeDefined();
      expect(typeof toolsModule.getTool).toBe('function');
    });

    it('should export tools array', async () => {
      const toolsModule = await import('../../../../../../src/core/tools/index.ts');
      expect(toolsModule.tools).toBeDefined();
      expect(Array.isArray(toolsModule.tools)).toBe(true);
    });
  });

  describe('Tool Structure', () => {
    it('get_current_time tool should have correct structure', async () => {
      const { getTool } = await import('../../../../../../src/core/tools/index.ts');
      const tool = getTool('get_current_time');

      expect(tool).toBeDefined();
      expect(tool?.name).toBe('get_current_time');
      expect(tool?.description).toBeDefined();
      expect(tool?.parameters).toBeDefined();
      expect(typeof tool?.execute).toBe('function');
    });

    it('should return undefined for non-existent tool', async () => {
      const { getTool } = await import('../../../../../../src/core/tools/index.ts');
      const tool = getTool('non_existent_tool');
      expect(tool).toBeUndefined();
    });
  });

  describe('get_current_time execution', () => {
    it('should return current time', async () => {
      const { getTool } = await import('../../../../../../src/core/tools/index.ts');
      const tool = getTool('get_current_time');

      expect(tool).toBeDefined();
      const result = await tool?.execute({});
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should accept timezone parameter', async () => {
      const { getTool } = await import('../../../../../../src/core/tools/index.ts');
      const tool = getTool('get_current_time');

      const result = await tool?.execute({ timezone: 'America/New_York' });
      expect(typeof result).toBe('string');
    });
  });
});
