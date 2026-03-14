// Tipos principales del sistema

export interface Config {
  telegram: {
    botToken: string;
    allowedUserIds: string[];
  };
  llm: {
    openai?: {
      apiKey: string;
      model: string;
    };
    groq: {
      apiKey: string;
      model: string;
    };
    openrouter: {
      apiKey: string;
      model: string;
    };
  };
  database: {
    path: string;
  };
  agent: {
    maxIterations: number;
    timeoutMs: number;
  };
  // OpenAI TTS (Text-to-Speech)
  openai: {
    tts: {
      apiKey: string;
      model: 'tts-1' | 'tts-1-hd';
      voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
    };
  };
  // ElevenLabs TTS (opcional, como fallback)
  elevenlabs: {
    apiKey: string;
    voiceId: string;
    model: string;
  };
  // Smart Memory configuration
  smartMemory?: {
    enabled: boolean;
    enableFactExtraction: boolean;
    enableSemanticSearch: boolean;
    enableAutoSummarization: boolean;
    factExtractionInterval: number;
    summarizationThreshold: number;
    maxFactsReturned: number;
    factRetentionDays: number;
    minConfidenceThreshold: number;
  };
}

export interface Message {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  toolCalls?: ToolCall[];
  toolCallId?: string;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface ToolParameter {
  type: string;
  description?: string;
  enum?: string[];
  items?: ToolParameter | ToolParameterProperties;
}

export interface ToolParameterProperties {
  type: string;
  properties?: Record<string, ToolParameter>;
  required?: string[];
}

export interface Tool {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, ToolParameter | ToolParameterProperties>;
    required?: string[];
  };
  execute: (args: Record<string, unknown>) => Promise<string>;
}

export interface ToolResult {
  toolCallId: string;
  output: string;
}

export interface AgentResponse {
  content: string;
  toolCalls?: ToolCall[];
  finished: boolean;
}

export interface LLMProvider {
  name: string;
  complete(messages: Message[], tools: Tool[]): Promise<AgentResponse>;
  isAvailable(): boolean;
}

export interface TelegramUser {
  id: number;
  username?: string;
  firstName?: string;
  lastName?: string;
}

export interface ConversationContext {
  userId: number;
  username?: string;
  messages: Message[];
  startedAt: Date;
  lastActivity: Date;
}

// Preferencias del usuario para respuestas de audio
export interface AudioPreferences {
  alwaysAudio: boolean;        // Si true, siempre enviar audio
  audioForShort: boolean;      // Si true, enviar audio para respuestas cortas
  shortResponseLimit: number;  // Límite de caracteres para considerar "corta"
}

// Preferencias del usuario
export interface UserPreferences {
  audio: AudioPreferences;
  personalityMode: 'friendly' | 'professional' | 'casual' | 'motivational';
}
