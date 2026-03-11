/**
 * ElevenLabs - Texto a Voz
 * Voz masculina natural para AgenteDafo
 */

import * as fs from 'fs';
import * as https from 'https';

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

  try {
    const audioBuffer = await new Promise<Buffer>((resolve, reject) => {
      const postData = JSON.stringify({
        text: cleanedText,
        model_id: model,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          use_speaker_boost: true,
        },
      });

      const options = {
        hostname: 'api.elevenlabs.io',
        path: `/v1/text-to-speech/${voiceId}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
          'xi-api-key': apiKey,
        },
      };

      const req = https.request(options, (res) => {
        const chunks: Buffer[] = [];

        res.on('data', (chunk) => {
          chunks.push(chunk);
        });

        res.on('end', () => {
          const buffer = Buffer.concat(chunks);

          if (res.statusCode === 200) {
            resolve(buffer);
          } else {
            const errorText = buffer.toString('utf-8');
            reject(new Error(`Error en ElevenLabs: ${res.statusCode} - ${errorText}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.write(postData);
      req.end();
    });

    // Guardar el archivo
    fs.writeFileSync(outputPath, audioBuffer);

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
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.elevenlabs.io',
      path: '/v1/voices',
      method: 'GET',
      headers: {
        'xi-api-key': apiKey,
      },
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            resolve(JSON.parse(data));
          } catch {
            reject(new Error('Error al parsear respuesta'));
          }
        } else {
          reject(new Error(`Error ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
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
