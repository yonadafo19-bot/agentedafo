/**
 * OpenAI Text-to-Speech
 * Voz natural para AgenteDafo
 * Más económico y confiable que ElevenLabs
 */

import OpenAI from 'openai';
import { writeFile } from 'fs/promises';

interface OpenAITTSConfig {
  apiKey: string;
  model?: 'tts-1' | 'tts-1-hd';
  voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
}

/**
 * Convierte texto a audio usando OpenAI TTS
 *
 * Voces disponibles:
 * - alloy: Masculina, versátil, natural (Recomendada)
 * - echo: Masculina, cálida
 * - fable: Británica, cuento de hadas
 * - onyx: Masculina, profunda
 * - nova: Femenina, amigable
 * - shimmer: Femenina, clara
 */
export async function textToSpeech(
  text: string,
  outputPath: string,
  config: OpenAITTSConfig
): Promise<Buffer> {
  const { apiKey, model = 'tts-1', voice = 'alloy' } = config;

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY no está configurada para TTS');
  }

  // Limpiar el texto para hacerlo más natural
  const cleanedText = cleanTextForSpeech(text);

  console.log(`🎤 OpenAI TTS: Generando audio para texto de ${cleanedText.length} caracteres...`);
  console.log(`🎤 Usando voz: ${voice}, modelo: ${model}`);

  try {
    const client = new OpenAI({ apiKey });

    // Generar audio con OpenAI TTS
    const mp3 = await client.audio.speech.create({
      model,
      voice,
      input: cleanedText,
      response_format: 'mp3',
    });

    // Convertir a Buffer
    const buffer = Buffer.from(await mp3.arrayBuffer());

    // Guardar el archivo
    await writeFile(outputPath, buffer);

    console.log(`✅ Audio generado correctamente (${buffer.length} bytes)`);

    return buffer;
  } catch (error) {
    if (error instanceof Error) {
      // Manejar errores específicos de OpenAI
      if (error.message.includes('401')) {
        throw new Error('API key de OpenAI inválida. Verifica tu OPENAI_API_KEY');
      }
      if (error.message.includes('429')) {
        throw new Error('Límite de cuota de OpenAI excedido. Verifica tu cuenta');
      }
      if (error.message.includes('insufficient_quota')) {
        throw new Error('Créditos insuficientes en OpenAI. Agrega crédito a tu cuenta');
      }
      throw new Error(`Error en OpenAI TTS: ${error.message}`);
    }
    throw new Error('Error desconocido al generar audio');
  }
}

/**
 * Limpia el texto para mejor pronunciación
 */
function cleanTextForSpeech(text: string): string {
  let cleaned = text;

  // Eliminar markdown que no se pronuncia bien
  cleaned = cleaned.replace(/\*\*(.*?)\*\*/g, '$1'); // **negrita**
  cleaned = cleaned.replace(/\*(.*?)\*/g, '$1'); // *cursiva*
  cleaned = cleaned.replace(/`(.*?)`/g, '$1'); // `código`
  cleaned = cleaned.replace(/#{1,6}\s/g, ''); // Títulos markdown

  // Eliminar enlaces [texto](url) -> texto
  cleaned = cleaned.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

  // Eliminear emojis que pueden causar problemas
  cleaned = cleaned.replace(/[^\x00-\x7F]+/g, (match) => {
    // Mantener letras acentuadas y ñ, pero remover emojis
    const hasEmojis = /[\p{Emoji}]/u.test(match);
    return hasEmojis ? '' : match;
  });

  // Reemplazar abreviaturas comunes en español
  cleaned = cleaned.replace(/etc\./gi, 'etcétera');
  cleaned = cleaned.replace(/dr\./gi, 'doctor');
  cleaned = cleaned.replace(/sr\./gi, 'señor');
  cleaned = cleaned.replace(/sra\./gi, 'señora');
  cleaned = cleaned.replace(/ud\./gi, 'usted');

  // Limitar longitud (OpenAI tiene límite de ~4000 caracteres)
  if (cleaned.length > 4000) {
    cleaned = cleaned.substring(0, 3997) + '...';
  }

  return cleaned.trim();
}

/**
 * Verifica si la API key es válida
 */
export async function verifyApiKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
  try {
    const client = new OpenAI({ apiKey });

    // Hacer una petición simple para verificar
    await client.models.list();

    return {
      valid: true,
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('401')) {
        return {
          valid: false,
          error: 'API key inválida o expirada',
        };
      }
      return {
        valid: false,
        error: error.message,
      };
    }
    return {
      valid: false,
      error: 'Error desconocido',
    };
  }
}

/**
 * Voces disponibles en OpenAI TTS
 */
export const AVAILABLE_VOICES = {
  alloy: { name: 'Alloy', gender: 'Masculina', description: 'Versátil, natural (Recomendada)' },
  echo: { name: 'Echo', gender: 'Masculina', description: 'Cálida, amigable' },
  fable: { name: 'Fable', gender: 'Británica', description: 'Cuento de hadas' },
  onyx: { name: 'Onyx', gender: 'Masculina', description: 'Profunda, seria' },
  nova: { name: 'Nova', gender: 'Femenina', description: 'Amigable, clara' },
  shimmer: { name: 'Shimmer', gender: 'Femenina', description: 'Clara, suave' },
} as const;

export type OpenAIVoice = keyof typeof AVAILABLE_VOICES;
