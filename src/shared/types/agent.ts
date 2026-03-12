/**
 * Tipos relacionados con el Agente de IA
 */

/**
 * Rol en una conversación
 */
export type MessageRole = 'system' | 'user' | 'assistant' | 'tool';

/**
 * Mensaje en la conversación
 */
export interface Message {
  role: MessageRole;
  content: string;
  toolCalls?: ToolCall[];
  toolCallId?: string;
  timestamp?: Date;
}

/**
 * Llamada a una herramienta
 */
export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

/**
 * Resultado de ejecutar una herramienta
 */
export interface ToolResult {
  toolCallId: string;
  output: string;
  error?: string;
}

/**
 * Respuesta del agente
 */
export interface AgentResponse {
  content: string;
  toolCalls?: ToolCall[];
  finished: boolean;
  metadata?: {
    provider?: string;
    model?: string;
    tokensUsed?: number;
    duration?: number;
  };
}

/**
 * Contexto de una conversación
 */
export interface ConversationContext {
  userId: string;
  username?: string;
  messages: Message[];
  startedAt: Date;
  lastActivity: Date;
  metadata?: Record<string, unknown>;
}

/**
 * Opciones para ejecutar el agente
 */
export interface AgentOptions {
  systemPrompt?: string;
  maxIterations?: number;
  timeoutMs?: number;
  temperature?: number;
  maxTokens?: number;
}

/**
 * Evento del agente
 */
export type AgentEventType =
  | 'message_received'
  | 'thinking_start'
  | 'thinking_end'
  | 'tool_call_start'
  | 'tool_call_end'
  | 'tool_call_error'
  | 'response_ready'
  | 'error';

/**
 * Evento del agente con datos
 */
export interface AgentEvent {
  type: AgentEventType;
  timestamp: Date;
  data?: unknown;
  error?: Error;
}

/**
 * Listener para eventos del agente
 */
export type AgentEventListener = (event: AgentEvent) => void | Promise<void>;
