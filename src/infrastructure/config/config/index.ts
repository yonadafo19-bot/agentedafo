import dotenv from 'dotenv';
import type { Config } from '../../../../shared/types/index.js';

dotenv.config();

function parseAllowedUserIds(value: string): string[] {
  if (!value) return [];
  return value.split(',').map(id => id.trim()).filter(Boolean);
}

// Obtener OpenAI API key (reutilizar para LLM y TTS)
const openaiApiKey = process.env.OPENAI_API_KEY || '';

export const config: Config = {
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN || '',
    allowedUserIds: parseAllowedUserIds(process.env.TELEGRAM_ALLOWED_USER_IDS || ''),
  },
  llm: {
    openai: {
      apiKey: openaiApiKey,
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
  // OpenAI TTS (Text-to-Speech) - Más económico que ElevenLabs
  openai: {
    tts: {
      apiKey: openaiApiKey,
      model: (process.env.OPENAI_TTS_MODEL as 'tts-1' | 'tts-1-hd') || 'tts-1',
      voice: (process.env.OPENAI_TTS_VOICE as 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer') || 'alloy',
    },
  },
  // ElevenLabs TTS (opcional, como fallback)
  elevenlabs: {
    apiKey: process.env.ELEVENLABS_API_KEY || '',
    voiceId: process.env.ELEVENLABS_VOICE_ID || 'pNInz6obpgDQG0F56aId',
    model: process.env.ELEVENLABS_MODEL || 'eleven_multilingual_v2',
  },
  // Smart Memory configuration
  smartMemory: {
    enabled: process.env.SMART_MEMORY_ENABLED === 'true' || false,
    enableFactExtraction: process.env.SMART_MEMORY_FACT_EXTRACTION !== 'false',
    enableSemanticSearch: process.env.SMART_MEMORY_SEMANTIC_SEARCH === 'true' || false,
    enableAutoSummarization: process.env.SMART_MEMORY_AUTO_SUMMARIZATION !== 'false',
    factExtractionInterval: parseInt(process.env.SMART_MEMORY_EXTRACTION_INTERVAL || '20', 10),
    summarizationThreshold: parseInt(process.env.SMART_MEMORY_SUMMARIZATION_THRESHOLD || '50', 10),
    maxFactsReturned: parseInt(process.env.SMART_MEMORY_MAX_FACTS || '10', 10),
    factRetentionDays: parseInt(process.env.SMART_MEMORY_RETENTION_DAYS || '90', 10),
    minConfidenceThreshold: parseFloat(process.env.SMART_MEMORY_MIN_CONFIDENCE || '0.6'),
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
