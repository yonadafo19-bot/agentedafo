/**
 * Tests para LLM Integration
 */

import { describe, it, expect, vi } from 'vitest';

// Mock de config
vi.mock('../../../../../../src/infrastructure/config/config/index.ts', () => ({
  config: {
    llm: {
      groq: { apiKey: 'test-groq-key', model: 'llama-3.3-70b-versatile' },
      openai: { apiKey: 'test-openai-key', model: 'gpt-4o-mini' },
      openrouter: { apiKey: 'test-openrouter-key', model: 'anthropic/claude-3.5-sonnet' },
    },
  },
}));

describe('LLM Integration', () => {
  describe('module exports', () => {
    it('should export withFallback function', async () => {
      const llmModule = await import('../../../../../../src/integrations/llm/index.ts');
      expect(llmModule.withFallback).toBeDefined();
      expect(typeof llmModule.withFallback).toBe('function');
    });

    it('should export initializeProviders function', async () => {
      const llmModule = await import('../../../../../../src/integrations/llm/index.ts');
      expect(llmModule.initializeProviders).toBeDefined();
      expect(typeof llmModule.initializeProviders).toBe('function');
    });

    it('should export getProvider function', async () => {
      const llmModule = await import('../../../../../../src/integrations/llm/index.ts');
      expect(llmModule.getProvider).toBeDefined();
      expect(typeof llmModule.getProvider).toBe('function');
    });
  });

  describe('Provider classes', () => {
    it('GroqProvider should be available', async () => {
      const { GroqProvider } = await import('../../../../../../src/integrations/llm/groq.ts');
      expect(GroqProvider).toBeDefined();
      expect(typeof GroqProvider).toBe('function');
    });

    it('OpenAIProvider should be available', async () => {
      const { OpenAIProvider } = await import('../../../../../../src/integrations/llm/openai.ts');
      expect(OpenAIProvider).toBeDefined();
      expect(typeof OpenAIProvider).toBe('function');
    });
  });
});
