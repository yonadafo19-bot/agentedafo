/**
 * Whisper - Transcripción de audio usando Groq
 */

import { config } from '../../infrastructure/config/config/index.js';
import { createReadStream } from 'fs';
import FormData from 'form-data';
import * as https from 'https';

/**
 * Transcribe un archivo de audio usando Whisper de Groq
 */
export async function transcribeAudio(
  audioFilePath: string,
  language: string = 'es'
): Promise<string> {
  const apiKey = config.llm.groq.apiKey;

  if (!apiKey) {
    throw new Error('GROQ_API_KEY no está configurada. Se necesita para transcribir audio.');
  }

  try {
    // Crear FormData de forma síncrona con streams
    const formData = new FormData();

    // Usar stream para el archivo
    const fileStream = createReadStream(audioFilePath);
    formData.append('file', fileStream, {
      filename: 'audio.ogg',
      contentType: 'audio/ogg',
    });
    formData.append('model', 'whisper-large-v3-turbo');
    formData.append('language', language);
    formData.append('response_format', 'text');

    // Obtener headers del FormData
    const headers = formData.getHeaders({
      'Authorization': `Bearer ${apiKey}`,
    });

    // Hacer la petición usando http/https nativo
    const result = await new Promise<string>((resolve, reject) => {
      const req = https.request('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: headers as any,
      }, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          if (res.statusCode === 200) {
            resolve(data.trim());
          } else {
            reject(new Error(`Error en Groq Whisper: ${res.statusCode} ${data}`));
          }
        });
      });

      req.on('error', reject);
      formData.pipe(req);
    });

    return result;

  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Error al transcribir audio: ${error.message}`);
    }
    throw new Error('Error desconocido al transcribir audio');
  }
}

/**
 * Detecta el idioma del audio (opcional)
 */
export async function detectLanguage(audioFilePath: string): Promise<string> {
  const apiKey = config.llm.groq.apiKey;

  if (!apiKey) {
    throw new Error('GROQ_API_KEY no está configurada');
  }

  try {
    const formData = new FormData();
    const fileStream = createReadStream(audioFilePath);
    formData.append('file', fileStream, {
      filename: 'audio.ogg',
      contentType: 'audio/ogg',
    });
    formData.append('model', 'whisper-large-v3-turbo');

    const headers = formData.getHeaders({
      'Authorization': `Bearer ${apiKey}`,
    });

    const result = await new Promise<{ language?: string }>((resolve, reject) => {
      const req = https.request('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: headers as any,
      }, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          if (res.statusCode === 200) {
            try {
              resolve(JSON.parse(data));
            } catch {
              resolve({ language: 'es' });
            }
          } else {
            reject(new Error(`Error ${res.statusCode}`));
          }
        });
      });

      req.on('error', reject);
      formData.pipe(req);
    });

    return result.language || 'es';

  } catch (error) {
    return 'es';
  }
}
