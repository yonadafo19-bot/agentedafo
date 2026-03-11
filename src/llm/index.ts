import { GroqProvider } from './groq.js';
import { OpenRouterProvider } from './openrouter.js';
import { OpenAIProvider } from './openai.js';
import type { LLMProvider } from '../types/index.js';
import { config } from '../config/index.js';

// Proveedor primario
let primaryProvider: LLMProvider | null = null;

// Proveedor fallback
let fallbackProvider: LLMProvider | null = null;

// Inicializar proveedores
export function initializeProviders(): void {
  // OpenAI como primario (mejor calidad)
  if (config.llm.openai?.apiKey) {
    primaryProvider = new OpenAIProvider({
      apiKey: config.llm.openai.apiKey,
      model: config.llm.openai.model || 'gpt-4o-mini',
    });
  }
  // Groq como alternativa rápida
  else if (config.llm.groq.apiKey) {
    primaryProvider = new GroqProvider({
      apiKey: config.llm.groq.apiKey,
      model: config.llm.groq.model,
    });
  }

  // OpenRouter como fallback
  if (config.llm.openrouter.apiKey) {
    fallbackProvider = new OpenRouterProvider({
      apiKey: config.llm.openrouter.apiKey,
      model: config.llm.openrouter.model,
    });
  }

  // Si no hay primario pero hay fallback, promoverlo
  if (!primaryProvider && fallbackProvider) {
    primaryProvider = fallbackProvider;
    fallbackProvider = null;
  }

  if (!primaryProvider) {
    throw new Error('No hay ningún proveedor de LLM configurado');
  }
}

export function getProvider(): LLMProvider {
  if (!primaryProvider) {
    throw new Error('Proveedores no inicializados. Llama a initializeProviders() primero.');
  }
  return primaryProvider;
}

export function getFallbackProvider(): LLMProvider | null {
  return fallbackProvider;
}

export async function withFallback<T>(
  fn: (provider: LLMProvider) => Promise<T>
): Promise<T> {
  const provider = getProvider();

  try {
    return await fn(provider);
  } catch (error) {
    const fallback = getFallbackProvider();
    if (fallback) {
      console.log(`Error con ${provider.name}, intentando con ${fallback.name}...`);
      return await fn(fallback);
    }
    throw error;
  }
}
