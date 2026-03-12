/**
 * Tipos de configuración
 */

/**
 * Configuración de Telegram
 */
export interface TelegramConfig {
  botToken: string;
  allowedUserIds: string[];
  webhookUrl?: string;
  maxRetries?: number;
  timeout?: number;
}

/**
 * Configuración de un proveedor LLM
 */
export interface LLMProviderConfig {
  apiKey: string;
  model: string;
  baseUrl?: string;
  timeout?: number;
  maxRetries?: number;
}

/**
 * Configuración de múltiples proveedores LLM
 */
export interface LLMConfig {
  openai?: LLMProviderConfig;
  groq?: LLMProviderConfig;
  openrouter?: LLMProviderConfig;
  anthropic?: LLMProviderConfig;
  fallbackOrder?: string[];
}

/**
 * Configuración de base de datos
 */
export interface DatabaseConfig {
  url: string;
  poolSize?: number;
  connectionTimeout?: number;
  idleTimeout?: number;
  maxLifetime?: number;
}

/**
 * Configuración de caché
 */
export interface CacheConfig {
  enabled: boolean;
  driver: 'memory' | 'redis';
  redis?: {
    url: string;
    maxRetries?: number;
    retryDelayOnFailover?: number;
  };
  ttl?: {
    default: number;
    short: number;
    long: number;
  };
}

/**
 * Configuración de colas
 */
export interface QueueConfig {
  enabled: boolean;
  driver: 'memory' | 'bullmq';
  redis?: {
    url: string;
    maxRetries?: number;
  };
}

/**
 * Configuración de monitoreo
 */
export interface MonitoringConfig {
  enabled: boolean;
  logging: {
    level: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';
    pretty?: boolean;
  };
  metrics: {
    enabled: boolean;
    port?: number;
  };
  tracing: {
    enabled: boolean;
    exporter?: 'jaeger' | 'zipkin' | 'otlp';
    endpoint?: string;
  };
}

/**
 * Configuración del agente
 */
export interface AgentConfig {
  maxIterations: number;
  timeoutMs: number;
  defaultTemperature?: number;
  defaultMaxTokens?: number;
  systemPromptFile?: string;
}

/**
 * Configuración de Firebase
 */
export interface FirebaseConfig {
  enabled: boolean;
  projectId?: string;
  databaseUrl?: string;
  storageBucket?: string;
  credentials?: {
    clientEmail?: string;
    privateKey?: string;
  };
}

/**
 * Configuración de Google Workspace
 */
export interface GoogleConfig {
  credentialsPath?: string;
  clientId?: string;
  clientSecret?: string;
  redirectUri?: string;
}

/**
 * Configuración de ElevenLabs (TTS)
 */
export interface ElevenLabsConfig {
  apiKey: string;
  voiceId: string;
  model: string;
}

/**
 * Configuración completa de la aplicación
 */
export interface AppConfig {
  env: 'development' | 'staging' | 'production';
  telegram: TelegramConfig;
  llm: LLMConfig;
  database: DatabaseConfig;
  cache: CacheConfig;
  queue: QueueConfig;
  monitoring: MonitoringConfig;
  agent: AgentConfig;
  firebase?: FirebaseConfig;
  google?: GoogleConfig;
  elevenlabs?: ElevenLabsConfig;
}
