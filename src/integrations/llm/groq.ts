import Groq from 'groq-sdk';
import type { Message, Tool, LLMProvider, AgentResponse } from '../../shared/types/index.js';

interface GroqConfig {
  apiKey: string;
  model: string;
}

export class GroqProvider implements LLMProvider {
  name = 'Groq';
  private client: Groq;
  private model: string;

  constructor(config: GroqConfig) {
    if (!config.apiKey) {
      throw new Error('Groq API key es requerida');
    }
    this.client = new Groq({ apiKey: config.apiKey });
    this.model = config.model;
  }

  isAvailable(): boolean {
    return !!this.client.apiKey;
  }

  async complete(messages: Message[], tools: Tool[]): Promise<AgentResponse> {
    try {
      const groqMessages = messages.map(msg => {
        const groqMsg: {
          role: 'system' | 'user' | 'assistant' | 'tool';
          content: string;
          tool_calls?: Array<{
            id: string;
            type: string;
            function: {
              name: string;
              arguments: string;
            };
          }>;
          tool_call_id?: string;
        } = {
          role: msg.role,
          content: msg.content,
        };

        if (msg.toolCalls && msg.toolCalls.length > 0) {
          groqMsg.tool_calls = msg.toolCalls.map(tc => ({
            id: tc.id,
            type: 'function',
            function: {
              name: tc.name,
              arguments: JSON.stringify(tc.arguments),
            },
          }));
        }

        if (msg.toolCallId) {
          groqMsg.tool_call_id = msg.toolCallId;
        }

        return groqMsg;
      });

      const groqTools = tools.map(tool => ({
        type: 'function' as const,
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.parameters,
        },
      }));

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: groqMessages as any,
        tools: groqTools.length > 0 ? groqTools : undefined,
        tool_choice: groqTools.length > 0 ? 'auto' : undefined,
        temperature: 0.3, // Muy bajo para respuestas más deterministas y precisas
        max_tokens: 4096,
      });

      const choice = response.choices[0];
      if (!choice) {
        throw new Error('No se recibió respuesta del modelo');
      }

      const message = choice.message;
      const toolCalls = message.tool_calls?.map(tc => ({
        id: tc.id,
        name: tc.function.name,
        arguments: JSON.parse(tc.function.arguments),
      }));

      return {
        content: message.content || '',
        toolCalls,
        finished: choice.finish_reason === 'stop' || !toolCalls || toolCalls.length === 0,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Error en Groq: ${error.message}`);
      }
      throw new Error('Error desconocido en Groq');
    }
  }
}
