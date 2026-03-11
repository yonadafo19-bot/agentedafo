import { Bot } from 'grammy';
import type { Context } from 'grammy';
import { config } from '../config/index.js';
import { Memory } from '../memory/index.js';
import { Agent } from '../agent/index.js';
import { initializeProviders } from '../llm/index.js';
import { isFirebaseAvailable, getFirestore } from '../config/firebase.js';
import { transcribeAudio } from '../audio/whisper.js';
import { textToSpeech } from '../audio/elevenlabs.js';
import { writeFile, unlink } from 'fs/promises';
import { createReadStream } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { InputFile } from 'grammy';
import * as personalNotes from '../personal/notes.js';
import { getTodayEvents, getEvents } from '../google/calendar.js';
import { getRecentEmails } from '../google/gmail.js';

export class TelegramBot {
  private bot: Bot;
  private memory: Memory;
  private agent: Agent;

  constructor() {
    // Inicializar proveedores de LLM
    initializeProviders();

    // Crear bot de Telegram
    this.bot = new Bot(config.telegram.botToken);

    // Inicializar memoria
    this.memory = new Memory(config.database.path);

    // Inicializar agente
    this.agent = new Agent();

    this.setupHandlers();
  }

  async initialize(): Promise<void> {
    // Inicializar base de datos (async para sql.js)
    await this.memory.initialize();
  }

  private setupHandlers(): void {
    // Middleware de autenticación
    this.bot.use((ctx, next) => {
      if (!this.isUserAllowed(ctx)) {
        ctx.reply('⛔ No tienes permiso para usar este bot.');
        return;
      }
      return next();
    });

    // Comando /start
    this.bot.command('start', (ctx) => {
      ctx.reply(
        '¡Hola! Soy AgenteDafo, tu asistente de IA personal.\n\n' +
        'Comandos disponibles:\n' +
        '/start - Iniciar el bot\n' +
        '/help - Mostrar ayuda\n' +
        '/clear - Limpiar el historial de conversación\n' +
        '/info - Información del bot\n' +
        '/tarea <texto> - Crear tarea rápida\n' +
        '/rutina - Ver rutina de ejercicios\n' +
        '/resumen [hoy|semana] - Resumen rápido\n\n' +
        '✨ *Puedes hablar conmigo por:*\n' +
        '• 📝 Mensajes de texto\n' +
        '• 🎤 Notas de voz (¡te respondo con audio!)\n\n' +
        '🔥 *Mis capacidades:*\n' +
        '• Búsquedas en internet\n' +
        '• Transcripción de audio\n' +
        '• Respuestas de voz naturales\n' +
        '• Guardar datos en Firebase\n\n' +
        '¡Envíame un audio para comenzar!',
        { parse_mode: 'Markdown' }
      );
    });

    // Comando /help
    this.bot.command('help', (ctx) => {
      ctx.reply(
        '📖 *Ayuda de AgenteDafo*\n\n' +
        '📋 *Comandos rápidos (sin LLM):*\n' +
        '• /tarea <texto> - Crea tarea al instante\n' +
        '• /rutina - Muestra tu rutina guardada\n' +
        '• /resumen [hoy|semana] - Resumen rápido\n\n' +
        '🎙️ *Comunicación:*\n' +
        '• 📝 Texto - Responde por escrito\n' +
        '• 🎤 Voz - ¡Te respondo con audio natural!\n\n' +
        '🧠 *Mis capacidades:*\n' +
        '• Responder preguntas\n' +
        '• Transcribir audios (Whisper)\n' +
        '• Respuestas de voz naturales (ElevenLabs)\n' +
        '• Búsqueda en tiempo real 🔍\n' +
        '• Guardar datos en Firebase 🔥\n\n' +
        '📋 *Otros comandos:*\n' +
        '/start - Iniciar el bot\n' +
        '/clear - Limpiar historial\n' +
        '/info - Info del sistema\n\n' +
        '💬 *Tip*: Envíame un audio y te responderé con mi voz.',
        { parse_mode: 'Markdown' }
      );
    });

    // Comando /clear
    this.bot.command('clear', (ctx) => {
      const userId = ctx.from!.id;
      this.memory.clearConversation(userId);
      ctx.reply('🗑️ Historial de conversación limpiado.');
    });

    // Comando /info
    this.bot.command('info', (ctx) => {
      ctx.reply(
        'ℹ️ *AgenteDafo v1.0.0*\n\n' +
        `Usuario: ${ctx.from!.username || ctx.from!.first_name || 'Desconocido'}\n` +
        `User ID: ${ctx.from!.id}\n` +
        'Estado: ✅ Activo\n' +
        'Proveedor LLM: Groq (con fallback OpenRouter)',
        { parse_mode: 'Markdown' }
      );
    });

    // Comando /tarea - Crear tarea rápida
    this.bot.command('tarea', async (ctx) => {
      const userId = ctx.from!.id;
      const username = ctx.from!.username || ctx.from!.first_name;
      const texto = ctx.message?.text?.substring(7).trim();

      if (!texto) {
        await ctx.reply('❌ Uso: /tarea <descripción>\nEjemplo: /tarea Llamar a Juan a las 5pm');
        return;
      }

      try {
        // Crear tarea directamente usando personalNotes.createTask
        const resultado = await personalNotes.createTask(
          userId.toString(),
          texto,
          '',
          undefined,
          'general'
        );

        // Guardar en ChatDafo para auditoría
        await this.saveToChatDafo(userId, username, 'user', `/tarea ${texto}`);
        await this.saveToChatDafo(userId, username, 'assistant', resultado);

        await ctx.reply(resultado);
      } catch (error) {
        const errorMsg = this.handleCommandError(error, 'crear tarea');
        await ctx.reply(errorMsg);
      }
    });

    // Comando /rutina - Mostrar rutina del día
    this.bot.command('rutina', async (ctx) => {
      const userId = ctx.from!.id;
      const username = ctx.from!.username || ctx.from!.first_name;

      try {
        // Obtener rutina con personalNotes.getExerciseRoutine
        const rutina = await personalNotes.getExerciseRoutine(userId.toString());

        // Guardar en ChatDafo para auditoría
        await this.saveToChatDafo(userId, username, 'user', '/rutina');
        await this.saveToChatDafo(userId, username, 'assistant', rutina);

        // Si no hay rutina, agregar mensaje instructivo
        if (rutina.includes('No tienes notas guardadas')) {
          await ctx.reply(
            '🏋️ No tienes una rutina de ejercicios guardada.\n\n' +
            'Para crear una, dime algo como:\n' +
            '• "Crea una rutina de pecho y tríceps"\n' +
            '• "Guarda una rutina de pierna"\n' +
            '• "Rutina de_full_body con 5 ejercicios"'
          );
        } else {
          await ctx.reply(rutina, { parse_mode: 'Markdown' });
        }
      } catch (error) {
        const errorMsg = this.handleCommandError(error, 'obtener rutina');
        await ctx.reply(errorMsg);
      }
    });

    // Comando /resumen - Resumen rápido
    this.bot.command('resumen', async (ctx) => {
      const userId = ctx.from!.id;
      const username = ctx.from!.username || ctx.from!.first_name;
      const args = ctx.message?.text?.split(' ');
      const periodo = args?.[1] || 'hoy';

      try {
        // Enviar indicador de "escribiendo..."
        await ctx.api.sendChatAction(userId, 'typing');

        // Consultas en paralelo: tareas, eventos y emails
        const [tareas, eventos, emails] = await Promise.allSettled([
          personalNotes.listPendingTasks(userId.toString()),
          periodo === 'hoy'
            ? getTodayEvents()
            : getEvents('primary', 7),
          getRecentEmails(3)
        ]);

        // Construir resumen Markdown
        let resumen = `📊 **Resumen ${periodo === 'hoy' ? 'de hoy' : 'de esta semana'}**\n\n`;

        // Tareas (tolerante a fallos)
        if (tareas.status === 'fulfilled') {
          resumen += tareas.value;
        } else {
          resumen += '📋 Tareas: No disponibles\n';
        }
        resumen += '\n';

        // Eventos (tolerante a fallos)
        if (eventos.status === 'fulfilled') {
          // Eliminar el encabezado duplicado si existe
          const eventosStr = eventos.value
            .replace(/📅 \*\*Eventos.*?\*\*\n\n/, '');
          resumen += '📅 ' + eventosStr;
        } else {
          resumen += '📅 Eventos: No disponibles\n';
        }
        resumen += '\n';

        // Emails (tolerante a fallos)
        if (emails.status === 'fulfilled') {
          // Eliminar el encabezado duplicado si existe
          const emailsStr = emails.value
            .replace(/📧 \*\*Últimos.*?\*\*\n\n/, '');
          resumen += '📧 ' + emailsStr;
        } else {
          resumen += '📧 Emails: No disponibles\n';
        }

        // Guardar en ChatDafo para auditoría
        await this.saveToChatDafo(userId, username, 'user', `/resumen ${periodo}`);
        await this.saveToChatDafo(userId, username, 'assistant', resumen);

        await ctx.reply(resumen, { parse_mode: 'Markdown' });
      } catch (error) {
        const errorMsg = this.handleCommandError(error, 'obtener resumen');
        await ctx.reply(errorMsg);
      }
    });

    // Manejar mensajes de texto
    this.bot.on('message:text', async (ctx) => {
      await this.handleUserMessage(ctx);
    });

    // Manejar mensajes de voz
    this.bot.on('message:voice', async (ctx) => {
      await this.handleVoiceMessage(ctx);
    });

    // Manejar mensajes de foto/imagen
    this.bot.on('message:photo', async (ctx) => {
      await this.handlePhotoMessage(ctx);
    });
  }

  /**
   * Extrae URLs de imágenes de una respuesta de texto
   */
  private extractImageUrls(text: string): string[] {
    const urlRegex = /https?:\/\/[^\s]+\.(?:png|jpg|jpeg|gif|webp)[^\s]*/gi;
    const urls = text.match(urlRegex) || [];

    // También buscar URLs de oaidalleapiprodscus (OpenAI DALL-E)
    const dalleRegex = /https?:\/\/oaidalleapiprodscus\.blob\.core\.windows\.net\/[^\s]+/gi;
    const dalleUrls = text.match(dalleRegex) || [];

    return [...new Set([...urls, ...dalleUrls])];
  }

  /**
   * Manejo consistente de errores para comandos rápidos
   */
  private handleCommandError(error: unknown, action: string): string {
    console.error(`Error al ${action}:`, error);

    const errorMsg = error instanceof Error ? error.message : 'Error desconocido';

    // Mensajes amigables según el tipo de error
    if (errorMsg.includes('Firebase') || errorMsg.includes('Firestore')) {
      return `❌ Error de base de datos al ${action}. Verifica que Firebase esté configurado.`;
    }
    if (errorMsg.includes('Google') || errorMsg.includes('OAuth')) {
      return `⚠️ No se pudo acceder a Google al ${action}. Verifica la autenticación.`;
    }
    if (errorMsg.includes('ENOTFOUND') || errorMsg.includes('network')) {
      return `⚠️ Error de conexión al ${action}. Verifica tu internet.`;
    }

    return `❌ Error al ${action}: ${errorMsg}`;
  }

  private isUserAllowed(ctx: Context): boolean {
    const userId = ctx.from?.id;
    if (!userId) return false;

    const userIdStr = userId.toString();
    return config.telegram.allowedUserIds.includes(userIdStr);
  }

  /**
   * Guarda un mensaje en la colección ChatDafo de Firestore
   */
  private async saveToChatDafo(
    userId: number,
    username: string | undefined,
    role: 'user' | 'assistant',
    content: string
  ): Promise<void> {
    try {
      if (!isFirebaseAvailable()) {
        return; // Silenciosamente omitir si Firebase no está disponible
      }

      const db = getFirestore();
      const chatId = `${userId}_${Date.now()}`;

      await db.collection('ChatDafo').doc(chatId).set({
        userId,
        username: username || 'Desconocido',
        role,
        content,
        timestamp: new Date().toISOString(),
        date: new Date().toISOString().split('T')[0] // Para poder filtrar por día
      });
    } catch (error) {
      // No fallar el flujo principal si hay error en Firestore
      console.warn('⚠️  Error guardando en ChatDafo:', error);
    }
  }

  private async handleUserMessage(ctx: Context): Promise<void> {
    const userId = ctx.from!.id;
    const username = ctx.from!.username || ctx.from!.first_name || undefined;
    const userMessage = ctx.message?.text;

    if (!userMessage) {
      return;
    }

    // Enviar indicador de "escribiendo..."
    await ctx.api.sendChatAction(userId, 'typing');

    try {
      // Actualizar o crear conversación
      this.memory.createOrUpdateConversation(userId, username);

      // Obtener historial de la conversación
      const context = this.memory.getConversation(userId);
      const history = context?.messages || [];

      // Ejecutar agente pasando el userId
      const result = await this.agent.run(userMessage, history, userId.toString());

      // Guardar mensaje del usuario en ChatDafo (Firestore)
      await this.saveToChatDafo(userId, username, 'user', userMessage);

      // Guardar respuesta del asistente en ChatDafo (Firestore)
      await this.saveToChatDafo(userId, username, 'assistant', result.response);

      // Guardar mensaje del usuario en memoria local
      this.memory.addMessage(userId, {
        role: 'user',
        content: userMessage,
      });

      // Guardar mensajes nuevos del agente en memoria local
      for (const msg of result.messages) {
        this.memory.addMessage(userId, msg);
      }

      // Extraer URLs de imágenes de la respuesta y enviarlas como fotos
      const imageUrls = this.extractImageUrls(result.response);

      if (imageUrls.length > 0) {
        // Enviar texto primero
        const textWithoutUrls = result.response
          .replace(/🔗 https?:\/\/[^\s]+/g, '')
          .replace(/https?:\/\/[^\s]+/g, '')
          .trim();

        if (textWithoutUrls) {
          await ctx.reply(textWithoutUrls);
        }

        // Enviar imágenes
        for (const url of imageUrls) {
          try {
            await ctx.api.sendPhoto(userId, url);
          } catch (e) {
            // Si falla enviar la foto, enviar la URL como texto
            await ctx.reply(`🔗 ${url}`);
          }
        }
      } else {
        // Enviar respuesta normal
        await ctx.reply(result.response);
      }

    } catch (error) {
      console.error('Error procesando mensaje:', error);
      await ctx.reply(
        '❌ Ocurrió un error al procesar tu mensaje. Por favor, inténtalo de nuevo.'
      );
    }
  }

  private async handleVoiceMessage(ctx: Context): Promise<void> {
    const userId = ctx.from!.id;
    const username = ctx.from!.username || ctx.from!.first_name || undefined;
    const voice = ctx.message?.voice;

    if (!voice) {
      return;
    }

    // Enviar indicador de "grabando..." o "procesando audio..."
    await ctx.api.sendChatAction(userId, 'record_voice');

    try {
      // Descargar el archivo de audio
      const file = await ctx.api.getFile(voice.file_id);

      // Crear ruta temporal para el archivo
      const tempPath = join(tmpdir(), `voice_${Date.now()}.ogg`);

      try {
        // Descargar el archivo
        const fileUrl = `https://api.telegram.org/file/bot${config.telegram.botToken}/${file.file_path}`;
        const response = await fetch(fileUrl);

        if (!response.ok) {
          throw new Error('Error al descargar el audio de Telegram');
        }

        const audioBuffer = Buffer.from(await response.arrayBuffer());
        await writeFile(tempPath, audioBuffer);

        // Transcribir el audio usando Whisper de Groq
        await ctx.api.sendChatAction(userId, 'typing');
        const transcription = await transcribeAudio(tempPath);

        if (!transcription || transcription.trim().length === 0) {
          await ctx.reply('🎤 No pude transcribir el audio. ¿Podrías intentarlo de nuevo?');
          return;
        }

        // Mostrar la transcripción al usuario
        await ctx.reply(`🎤 *Transcripción:*\n\n"${transcription}"`, { parse_mode: 'Markdown' });

        // Procesar la transcripción como un mensaje de texto normal
        const userMessage = transcription;

        // Actualizar o crear conversación
        this.memory.createOrUpdateConversation(userId, username);

        // Obtener historial de la conversación
        const context = this.memory.getConversation(userId);
        const history = context?.messages || [];

        // Ejecutar agente pasando el userId
        const result = await this.agent.run(userMessage, history, userId.toString());

        // Guardar transcripción y respuesta en ChatDafo
        await this.saveToChatDafo(userId, username, 'user', `🎤 [AUDIO]: ${userMessage}`);
        await this.saveToChatDafo(userId, username, 'assistant', result.response);

        // Guardar en memoria local
        this.memory.addMessage(userId, {
          role: 'user',
          content: `🎤 [AUDIO]: ${userMessage}`,
        });

        for (const msg of result.messages) {
          this.memory.addMessage(userId, msg);
        }

        // Generar respuesta de audio con ElevenLabs
        await ctx.api.sendChatAction(userId, 'record_voice');

        const responseAudioPath = join(tmpdir(), `response_${Date.now()}.mp3`);

        try {
          // Generar audio con ElevenLabs
          await textToSpeech(result.response, responseAudioPath, {
            apiKey: config.elevenlabs.apiKey,
            voiceId: config.elevenlabs.voiceId,
            model: config.elevenlabs.model,
          });

          // Crear un stream del archivo
          const audioStream = createReadStream(responseAudioPath);

          // Enviar el audio como nota de voz usando InputFile
          await ctx.replyWithVoice(new InputFile(audioStream, 'response.mp3'));

        } catch (error) {
          // Si falla la generación de audio, enviar respuesta de texto
          console.warn('⚠️  Error generando audio con ElevenLabs:', error);
          await ctx.reply(result.response);
        } finally {
          // Limpiar el archivo de audio temporal
          try {
            await unlink(responseAudioPath);
          } catch {
            // Ignorar errores al eliminar
          }
        }

      } finally {
        // Limpiar el archivo temporal
        try {
          await unlink(tempPath);
        } catch {
          // Ignorar errores al eliminar el archivo temporal
        }
      }

    } catch (error) {
      console.error('Error procesando audio:', error);
      await ctx.reply(
        '❌ Ocurrió un error al procesar el audio. ' +
        (error instanceof Error && error.message.includes('GROQ_API_KEY')
          ? 'La API key de Groq no está configurada para transcripción.'
          : 'Por favor, inténtalo de nuevo.')
      );
    }
  }

  private async handlePhotoMessage(ctx: Context): Promise<void> {
    const userId = ctx.from!.id;
    const username = ctx.from!.username || ctx.from!.first_name || undefined;
    const photo = ctx.message?.photo;

    if (!photo || photo.length === 0) {
      return;
    }

    // Enviar indicador de "procesando..."
    await ctx.api.sendChatAction(userId, 'typing');

    try {
      // Obtener la foto de mayor resolución (última del array)
      const largestPhoto = photo[photo.length - 1];
      const file = await ctx.api.getFile(largestPhoto.file_id);

      // Crear ruta temporal para el archivo
      const tempPath = join(tmpdir(), `photo_${Date.now()}.jpg`);

      try {
        // Descargar el archivo
        const fileUrl = `https://api.telegram.org/file/bot${config.telegram.botToken}/${file.file_path}`;
        const response = await fetch(fileUrl);

        if (!response.ok) {
          throw new Error('Error al descargar la imagen de Telegram');
        }

        const imageBuffer = Buffer.from(await response.arrayBuffer());
        await writeFile(tempPath, imageBuffer);

        // Convertir a base64 para analizar
        const base64Image = imageBuffer.toString('base64');
        const mimeType = 'image/jpeg';

        // Analizar la imagen con GPT-4 Vision
        const { getImageGenerator } = await import('../image/openai.js');
        const imageGen = getImageGenerator();

        // Primero obtener una descripción general
        const description = await imageGen.describeImageFromBase64(
          base64Image,
          mimeType,
          'Describe esta imagen en detalle. ¿Qué ves? Si hay texto, extráelo también.'
        );

        // Mostrar la descripción al usuario
        await ctx.reply(`🖼️ **Análisis de imagen**\n\n${description}`, { parse_mode: 'Markdown' });

        // Guardar en ChatDafo
        await this.saveToChatDafo(userId, username, 'user', `📷 [IMAGEN]: ${description}`);

        // Procesar como un mensaje normal para posible conversación
        const userMessage = `El usuario envió una imagen. Contenido: ${description}`;

        // Actualizar o crear conversación
        this.memory.createOrUpdateConversation(userId, username);

        // Obtener historial de la conversación
        const context = this.memory.getConversation(userId);
        const history = context?.messages || [];

        // Ejecutar agente para posible respuesta contextual
        const result = await this.agent.run(userMessage, history, userId.toString());

        // Si hay respuesta adicional del agente, enviarla
        if (result.response && result.response.trim().length > 0) {
          await this.saveToChatDafo(userId, username, 'assistant', result.response);
          await ctx.reply(result.response);
        }

      } finally {
        // Limpiar el archivo temporal
        try {
          await unlink(tempPath);
        } catch {
          // Ignorar errores al eliminar el archivo temporal
        }
      }

    } catch (error) {
      console.error('Error procesando imagen:', error);
      await ctx.reply(
        '❌ Ocurrió un error al procesar la imagen. ' +
        (error instanceof Error && error.message.includes('OPENAI_API_KEY')
          ? 'La API key de OpenAI no está configurada para visión.'
          : 'Por favor, inténtalo de nuevo.')
      );
    }
  }

  async start(): Promise<void> {
    console.log('🚀 Iniciando AgenteDafo...');
    console.log(`📊 Base de datos: ${config.database.path}`);
    console.log(`🔒 Usuarios permitidos: ${config.telegram.allowedUserIds.length}`);

    // Verificar estado de Firebase
    const firebaseAvailable = isFirebaseAvailable();
    if (firebaseAvailable) {
      console.log('🔥 Firebase: ✅ Disponible (Firestore, Storage)');
    } else {
      console.log('🔥 Firebase: ⚠️  No configurado');
    }

    // Inicializar memoria (async)
    await this.initialize();

    this.bot.start();
    console.log('✅ Bot iniciado correctamente. Esperando mensajes...');

    // Manejar cierre graceful
    const shutdown = async () => {
      console.log('\n🛑 Cerrando AgenteDafo...');
      this.memory.close();
      this.bot.stop();
      console.log('👋 ¡Hasta pronto!');
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  }
}
