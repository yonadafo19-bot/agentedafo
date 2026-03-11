/**
 * OpenAI Image Generation & Vision
 * Generación de imágenes con DALL-E y visión con GPT-4 Vision
 */

import OpenAI from 'openai';

interface ImageConfig {
  apiKey: string;
}

export class OpenAIImage {
  private client: OpenAI;

  constructor(config: ImageConfig) {
    if (!config.apiKey) {
      throw new Error('OpenAI API key es requerida para imágenes');
    }
    this.client = new OpenAI({ apiKey: config.apiKey });
  }

  /**
   * Genera una imagen con DALL-E 3
   */
  async generateImage(
    prompt: string,
    size: '256x256' | '512x512' | '1024x1024' | '1792x1024' | '1024x1792' = '1024x1024',
    quality: 'standard' | 'hd' = 'standard',
    style: 'vivid' | 'natural' = 'vivid'
  ): Promise<{ url: string; revisedPrompt?: string }> {
    try {
      // Mejorar el prompt para mantener exactitud
      const enhancedPrompt = `IMPORTANT: Generate EXACTLY what is described. Maintain ALL specific details including colors, sizes, and positions. Do not add variations or alternatives.

${prompt}`;

      const response = await this.client.images.generate({
        model: 'dall-e-3',
        prompt: enhancedPrompt,
        size,
        quality,
        style,
        n: 1,
      });

      const image = response.data?.[0];
      if (!image) {
        throw new Error('No se generó ninguna imagen');
      }
      return {
        url: image.url!,
        revisedPrompt: image.revised_prompt,
      };
    } catch (error) {
      throw new Error(`Error generando imagen: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  /**
   * Genera una imagen con DALL-E 2 (más económico)
   */
  async generateImageDalle2(
    prompt: string,
    size: '256x256' | '512x512' | '1024x1024' = '512x512'
  ): Promise<{ url: string }> {
    try {
      const response = await this.client.images.generate({
        model: 'dall-e-2',
        prompt,
        size,
        n: 1,
      });

      const image = response.data?.[0];
      if (!image) {
        throw new Error('No se generó ninguna imagen');
      }
      return {
        url: image.url!,
      };
    } catch (error) {
      throw new Error(`Error generando imagen: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  /**
   * Analiza/describe una imagen usando GPT-4 Vision
   */
  async describeImage(
    imageUrl: string,
    prompt: string = 'Describe esta imagen en detalle. ¿Qué ves?'
  ): Promise<string> {
    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-4o-mini', // Modelo con visión
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl,
                  detail: 'high',
                },
              },
            ],
          },
        ],
        max_tokens: 500,
      });

      return response.choices[0].message.content || 'No pude analizar la imagen.';
    } catch (error) {
      throw new Error(`Error analizando imagen: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  /**
   * Analiza una imagen desde un buffer/base64
   */
  async describeImageFromBase64(
    base64Data: string,
    mimeType: string,
    prompt: string = 'Describe esta imagen en detalle. ¿Qué ves?'
  ): Promise<string> {
    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${base64Data}`,
                  detail: 'high',
                },
              },
            ],
          },
        ],
        max_tokens: 500,
      });

      return response.choices[0].message.content || 'No pude analizar la imagen.';
    } catch (error) {
      throw new Error(`Error analizando imagen: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  /**
   * Extrae texto de una imagen (OCR)
   */
  async extractTextFromImage(imageUrl: string): Promise<string> {
    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Extrae TODO el texto que veas en esta imagen. Si hay números, fechas, o cualquier información escrita, inclúyela. Formatea el resultado de manera clara.',
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl,
                  detail: 'high',
                },
              },
            ],
          },
        ],
        max_tokens: 1000,
      });

      return response.choices[0].message.content || 'No pude extraer texto de la imagen.';
    } catch (error) {
      throw new Error(`Error extrayendo texto: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  /**
   * Genera variaciones de una imagen
   */
  async createVariations(imageBuffer: Buffer, n: number = 2): Promise<string[]> {
    try {
      const response = await this.client.images.createVariation({
        image: imageBuffer as any,
        n,
        size: '1024x1024',
      });

      const data = response.data;
      if (!data) {
        throw new Error('No se generaron variaciones');
      }
      return data.map((img: any) => img.url!);
    } catch (error) {
      throw new Error(`Error creando variaciones: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  /**
   * Edita una imagen (requiere imagen original + máscara)
   */
  async editImage(
    imageBuffer: Buffer,
    maskBuffer: Buffer,
    prompt: string
  ): Promise<{ url: string }> {
    try {
      const response = await this.client.images.edit({
        image: imageBuffer as any,
        mask: maskBuffer as any,
        prompt,
        n: 1,
        size: '1024x1024',
      });

      const firstImage = response.data?.[0];
      if (!firstImage) {
        throw new Error('No se generó ninguna imagen editada');
      }

      return {
        url: firstImage.url!,
      };
    } catch (error) {
      throw new Error(`Error editando imagen: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }
}

// Instancia singleton
let imageInstance: OpenAIImage | null = null;

export function getImageGenerator(): OpenAIImage {
  if (!imageInstance) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY no está configurada');
    }
    imageInstance = new OpenAIImage({ apiKey });
  }
  return imageInstance;
}
