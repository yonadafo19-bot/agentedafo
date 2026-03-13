import OpenAI from 'openai';
import type { Message, Tool, LLMProvider, AgentResponse } from '../types/index.js';

interface OpenRouterConfig {
  apiKey: string;
  model: string;
}

export class OpenRouterProvider implements LLMProvider {
  name = 'OpenRouter';
  private client: OpenAI;
  private model: string;

  constructor(config: OpenRouterConfig) {
    if (!config.apiKey) {
      throw new Error('OpenRouter API key es requerida');
    }
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: 'https://openrouter.ai/api/v1',
    });
    this.model = config.model;
  }

  isAvailable(): boolean {
    return !!this.client.apiKey;
  }

  async complete(messages: Message[], tools: Tool[]): Promise<AgentResponse> {
    try {
      const orMessages = messages.map(msg => {
        const orMsg: {
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
          orMsg.tool_calls = msg.toolCalls.map(tc => ({
            id: tc.id,
            type: 'function',
            function: {
              name: tc.name,
              arguments: JSON.stringify(tc.arguments),
            },
          }));
        }

        if (msg.toolCallId) {
          orMsg.tool_call_id = msg.toolCallId;
        }

        return orMsg;
      });

      const orTools = tools.map(tool => ({
        type: 'function' as const,
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.parameters,
        },
      }));

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: orMessages as any,
        tools: orTools.length > 0 ? orTools : undefined,
        tool_choice: orTools.length > 0 ? 'auto' : undefined,
        temperature: 0.7,
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
        throw new Error(`Error en OpenRouter: ${error.message}`);
      }
      throw new Error('Error desconocido en OpenRouter');
    }
  }
}
