/**
 * ElevenLabs - Texto a Voz
 * Voz masculina natural para AgenteDafo
 */

import * as fs from 'fs';

interface ElevenLabsConfig {
  apiKey: string;
  voiceId: string;
  model: string;
}

/**
 * Convierte texto a audio usando ElevenLabs
 */
export async function textToSpeech(
  text: string,
  outputPath: string,
  config: ElevenLabsConfig
): Promise<Buffer> {
  const { apiKey, voiceId, model } = config;

  if (!apiKey) {
    throw new Error('ELEVENLABS_API_KEY no está configurada');
  }

  // Limpiar el texto para hacerlo más natural
  const cleanedText = cleanTextForSpeech(text);

  console.log(`🎤 ElevenLabs: Generando audio para texto de ${cleanedText.length} caracteres...`);
  console.log(`🎤 Usando voz: ${voiceId}, modelo: ${model}`);

  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        text: cleanedText,
        model_id: model,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          use_speaker_boost: true,
        },
      }),
    });

    console.log(`🎤 ElevenLabs response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ ElevenLabs error (${response.status}): ${errorText}`);

      if (response.status === 401) {
        throw new Error('API key de ElevenLabs inválida o expirada. Verifica tu ELEVENLABS_API_KEY');
      }
      if (response.status === 404) {
        throw new Error(`Voz no encontrada: ${voiceId}. La voz puede haber sido eliminada o cambiada`);
      }
      if (response.status === 429) {
        throw new Error('Límite de cuota de ElevenLabs excedido. Verifica tu cuenta');
      }
      throw new Error(`Error en ElevenLabs: ${response.status} - ${errorText}`);
    }

    const audioBuffer = Buffer.from(await response.arrayBuffer());

    // Guardar el archivo
    fs.writeFileSync(outputPath, audioBuffer);

    console.log(`✅ Audio generado correctamente (${audioBuffer.length} bytes)`);

    return audioBuffer;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Error al generar audio: ${error.message}`);
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

  // Reemplazar abreviaturas comunes en español
  cleaned = cleaned.replace(/etc\./gi, 'etcétera');
  cleaned = cleaned.replace(/dr\./gi, 'doctor');
  cleaned = cleaned.replace(/sr\./gi, 'señor');
  cleaned = cleaned.replace(/sra\./gi, 'señora');
  cleaned = cleaned.replace(/ud\./gi, 'usted');

  // Añadir pausas naturales
  cleaned = cleaned.replace(/\. /g, '. ');
  cleaned = cleaned.replace(/\? /g, '? ');
  cleaned = cleaned.replace(/! /g, '! ');

  // Limitar longitud (ElevenLabs tiene límites)
  if (cleaned.length > 1000) {
    cleaned = cleaned.substring(0, 997) + '...';
  }

  return cleaned.trim();
}

/**
 * Obtiene información de las voces disponibles
 */
export async function getAvailableVoices(apiKey: string): Promise<any> {
  try {
    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      method: 'GET',
      headers: {
        'xi-api-key': apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${await response.text()}`);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Error desconocido al obtener voces');
  }
}

/**
 * Verifica si la API key es válida
 */
export async function verifyApiKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
  try {
    const response = await fetch('https://api.elevenlabs.io/v1/user', {
      method: 'GET',
      headers: {
        'xi-api-key': apiKey,
      },
    });

    if (response.ok) {
      return {
        valid: true,
      };
    } else {
      const errorText = await response.text();
      return {
        valid: false,
        error: `Error ${response.status}: ${errorText}`,
      };
    }
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * Voces masculinas recomendadas para español
 */
export const SPANISH_MALE_VOICES = {
  // Adam - Voz masculina, natural, versátil (Recomendada)
  adam: 'pNInz6obpgDQG0F56aId',

  // Antoni - Voz masculina profunda
  antoni: 'ErXwobaYiY0y8i4V4b3T',

  // Marcus - Voz masculina profesional
  marcus: 'zHfQ90cQJz4wzK4V4b3T',
};
