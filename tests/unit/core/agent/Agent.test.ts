/**
 * Tests para Agent
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Agent } from '../../../../../../src/core/agent/index.ts';

// Mock de dependencias
vi.mock('../../../../../src/core/tools/index.ts', () => ({
  tools: [],
  getTool: vi.fn(),
}));

vi.mock('../../../../../src/integrations/llm/index.ts', () => ({
  withFallback: vi.fn(),
}));

vi.mock('../../../../../src/infrastructure/config/index.ts', () => ({
  config: {
    agent: {
      maxIterations: 5,
      timeoutMs: 120000,
    },
  },
}));

describe('Agent', () => {
  let agent: Agent;

  beforeEach(() => {
    agent = new Agent();
  });

  describe('constructor', () => {
    it('should create agent with default system prompt', () => {
      expect(agent).toBeDefined();
    });

    it('should create agent with custom system prompt', () => {
      const customAgent = new Agent('Custom prompt');
      expect(customAgent).toBeDefined();
    });
  });

  describe('resetSystemPrompt', () => {
    it('should reset system prompt', () => {
      agent.resetSystemPrompt('New prompt');
      // Test that the method exists and doesn't throw
      expect(() => agent.resetSystemPrompt('Another prompt')).not.toThrow();
    });
  });
});
