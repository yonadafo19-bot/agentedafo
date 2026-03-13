/**
 * Tests para Google Integration
 */

import { describe, it, expect } from 'vitest';

describe('Google Integration', () => {
  describe('module exports', () => {
    it('should export oauth functions', async () => {
      const googleModule = await import('../../../../../../src/integrations/google/index.ts');
      // Verificar que el módulo se puede importar
      expect(googleModule).toBeDefined();
    });
  });

  describe('Google Drive tools', () => {
    it('should export google_drive_list tool', async () => {
      const { getTool } = await import('../../../../../../src/core/tools/index.ts');
      const tool = getTool('google_drive_list');
      expect(tool).toBeDefined();
      expect(tool?.name).toBe('google_drive_list');
    });

    it('should export google_drive_search tool', async () => {
      const { getTool } = await import('../../../../../../src/core/tools/index.ts');
      const tool = getTool('google_drive_search');
      expect(tool).toBeDefined();
      expect(tool?.name).toBe('google_drive_search');
    });
  });

  describe('Google Calendar tools', () => {
    it('should export google_today_events tool', async () => {
      const { getTool } = await import('../../../../../../src/core/tools/index.ts');
      const tool = getTool('google_today_events');
      expect(tool).toBeDefined();
      expect(tool?.name).toBe('google_today_events');
    });

    it('should export google_create_event tool', async () => {
      const { getTool } = await import('../../../../../../src/core/tools/index.ts');
      const tool = getTool('google_create_event');
      expect(tool).toBeDefined();
      expect(tool?.name).toBe('google_create_event');
    });
  });

  describe('Google Gmail tools', () => {
    it('should export google_recent_emails tool', async () => {
      const { getTool } = await import('../../../../../../src/core/tools/index.ts');
      const tool = getTool('google_recent_emails');
      expect(tool).toBeDefined();
      expect(tool?.name).toBe('google_recent_emails');
    });

    it('should export google_send_email tool', async () => {
      const { getTool } = await import('../../../../../../src/core/tools/index.ts');
      const tool = getTool('google_send_email');
      expect(tool).toBeDefined();
      expect(tool?.name).toBe('google_send_email');
    });
  });
});
