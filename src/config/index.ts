import dotenv from 'dotenv';
import type { Config } from '../types/index.js';

dotenv.config();

function parseAllowedUserIds(value: string): string[] {
  if (!value) return [];
  return value.split(',').map(id => id.trim()).filter(Boolean);
}

export const config: Config = {
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN || '',
    allowedUserIds: parseAllowedUserIds(process.env.TELEGRAM_ALLOWED_USER_IDS || ''),
  },
  llm: {
    openai: {
      apiKey: process.env.OPENAI_API_KEY || '',
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    },
    groq: {
      apiKey: process.env.GROQ_API_KEY || '',
      model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
    },
    openrouter: {
      apiKey: process.env.OPENROUTER_API_KEY || '',
      model: process.env.OPENROUTER_MODEL || 'openrouter/free',
    },
  },
  database: {
    path: process.env.DB_PATH || './memory.db',
  },
  agent: {
    maxIterations: parseInt(process.env.MAX_AGENT_ITERATIONS || '5', 10),
    timeoutMs: parseInt(process.env.AGENT_TIMEOUT_MS || '120000', 10),
  },
  elevenlabs: {
    apiKey: process.env.ELEVENLABS_API_KEY || '',
    voiceId: process.env.ELEVENLABS_VOICE_ID || 'pNInz6obpgDQG0F56aId', // Adam - voz masculina natural
    model: process.env.ELEVENLABS_MODEL || 'eleven_multilingual_v2',
  },
};

export function validateConfig(): void {
  const errors: string[] = [];

  if (!config.telegram.botToken) {
    errors.push('TELEGRAM_BOT_TOKEN es requerido');
  }

  if (config.telegram.allowedUserIds.length === 0) {
    errors.push('TELEGRAM_ALLOWED_USER_IDS es requerido');
  }

  if (!config.llm.openai?.apiKey && !config.llm.groq.apiKey && !config.llm.openrouter.apiKey) {
    errors.push('Al menos un proveedor de LLM es requerido (OPENAI_API_KEY, GROQ_API_KEY u OPENROUTER_API_KEY)');
  }

  if (errors.length > 0) {
    throw new Error(`Configuración inválida:\n${errors.map(e => `  - ${e}`).join('\n')}`);
  }
}
