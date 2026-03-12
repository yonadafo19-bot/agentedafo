/**
 * Constantes de límites - Cuotas y restricciones
 */

export const LIMITS = {
  // Mensajes
  MAX_MESSAGE_LENGTH: 4000,
  MAX_CAPTION_LENGTH: 1024,

  // Archivos
  MAX_FILE_SIZE_MB: 50,
  MAX_PHOTO_SIZE_MB: 10,
  MAX_VIDEO_SIZE_MB: 100,
  MAX_AUDIO_SIZE_MB: 50,

  // Rate limiting
  MESSAGES_PER_MINUTE: 30,
  MESSAGES_PER_HOUR: 200,

  // Agentes
  MAX_TOOL_ITERATIONS: 10,
  AGENT_TIMEOUT_MS: 120000, // 2 minutos

  // Conversaciones
  MAX_CONVERSATION_HISTORY: 100,
  MAX_CONTEXT_TOKENS: 8000,

  // Base de datos
  MAX_QUERY_RESULTS: 100,
  QUERY_TIMEOUT_MS: 30000,

  // Cache
  DEFAULT_CACHE_TTL_MS: 300000, // 5 minutos
  LONG_CACHE_TTL_MS: 3600000,   // 1 hora
  SHORT_CACHE_TTL_MS: 60000,    // 1 minuto

  // Almacenamiento
  MAX_NOTES_PER_USER: 1000,
  MAX_TASKS_PER_USER: 500,
  MAX_RUTINES_PER_USER: 50,

  // Archivos
  MAX_UPLOAD_SIZE_MB: 20,
  ALLOWED_FILE_TYPES: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'text/plain',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  ],
} as const;

export const QUOTAS = {
  FREE: {
    MAX_MESSAGES_PER_DAY: 100,
    MAX_TOOLS_PER_DAY: 50,
    MAX_STORAGE_MB: 100,
  },
  PRO: {
    MAX_MESSAGES_PER_DAY: 1000,
    MAX_TOOLS_PER_DAY: 500,
    MAX_STORAGE_MB: 1000,
  },
  ENTERPRISE: {
    MAX_MESSAGES_PER_DAY: -1, // Ilimitado
    MAX_TOOLS_PER_DAY: -1,
    MAX_STORAGE_MB: -1,
  },
} as const;
