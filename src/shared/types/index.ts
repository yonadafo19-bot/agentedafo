/**
 * Tipos compartidos - Definiciones de TypeScript usadas en toda la aplicación
 */

export * from './agent.js';
export * from './common.js';
export * from './config.js';
export * from './telegram.js';

// Re-exportar tipos del sistema original para compatibilidad
export type { ToolCall, ToolResult } from './agent.js';
export type { Message, ConversationContext } from './agent.js';
export type { AppConfig } from './config.js';
