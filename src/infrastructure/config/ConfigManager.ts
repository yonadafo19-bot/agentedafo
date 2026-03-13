/**
 * ConfigManager - Gestor de configuración centralizado
 */

import { resolve } from 'node:path';

interface AppConfig {
  app: { name: string; version: string; env: string };
  telegram: { botToken: string; allowedUserIds: string[] };
  llm: any;
  database: any;
  agent: any;
  monitoring: any;
}

class ConfigManager {
  private config: AppConfig | null = null;

  load(env: string = 'development'): AppConfig {
    const configPath = resolve(process.cwd(), `config/environments/${env}.yaml`);

    try {
      // Por ahora usar variables de entorno directamente
      this.config = {
        app: {
          name: 'agentedafo',
          version: '2.0.0',
          env: process.env.NODE_ENV || 'development',
        },
        telegram: {
          botToken: process.env.TELEGRAM_BOT_TOKEN || '',
          allowedUserIds: (process.env.TELEGRAM_ALLOWED_USER_IDS || '').split(',').map((s) => s.trim()).filter(Boolean),
        },
        llm: {
          groq: {
            apiKey: process.env.GROQ_API_KEY || '',
            model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
          },
          openai: {
            apiKey: process.env.OPENAI_API_KEY || '',
            model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
          },
        },
        database: {
          path: process.env.DB_PATH || './memory.db',
          poolSize: parseInt(process.env.DB_POOL_SIZE || '10', 10),
        },
        agent: {
          maxIterations: parseInt(process.env.MAX_AGENT_ITERATIONS || '5', 10),
          timeoutMs: parseInt(process.env.AGENT_TIMEOUT_MS || '120000', 10),
        },
        monitoring: {
          logLevel: process.env.LOG_LEVEL || 'info',
          metricsEnabled: process.env.METRICS_ENABLED === 'true',
        },
      };

      return this.config;
    } catch (error) {
      throw new Error(`Failed to load config from ${configPath}: ${error}`);
    }
  }

  get(): AppConfig {
    if (!this.config) {
      return this.load();
    }
    return this.config;
  }

  getTelegramBotToken(): string {
    return this.get().telegram.botToken;
  }

  getAllowedUserIds(): string[] {
    return this.get().telegram.allowedUserIds;
  }
}

export const configManager = new ConfigManager();
export const config = configManager.get();
