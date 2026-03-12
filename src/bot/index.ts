import { Bot } from 'grammy';
import type { Context } from 'grammy';
import { config } from '../config/index.js';
import { Memory } from '../memory/index.js';
import { Agent } from '../agent/index.js';
import { initializeProviders } from '../llm/index.js';
import { isFirebaseAvailable, getFirestore } from '../config/firebase.js';
import { transcribeAudio } from '../audio/whisper.js';
import { textToSpeech, verifyApiKey } from '../audio/elevenlabs.js';
import { writeFile, unlink } from 'fs/promises';
import { createReadStream } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { InputFile } from 'grammy';
import * as personalNotes from '../personal/notes.js';
import { getTodayEvents, getEvents } from '../google/calendar.js';
import { getRecentEmails } from '../google/gmail.js';
import type { AudioPreferences } from '../types/index.js';

export class TelegramBot {
  private bot: Bot;
  private memory: Memory;
  private agent: Agent;
  // Preferencias de audio por usuario (almacenadas en memoria)
  private userAudioPreferences: Map<number, AudioPreferences>;

  constructor() {
    // Inicializar proveedores de LLM
    initializeProviders();

    // Crear bot de Telegram
    this.bot = new Bot(config.telegram.botToken);

    // Inicializar memoria
    this.memory = new Memory(config.database.path);

    // Inicializar agente
    this.agent = new Agent();

    // Inicializar preferencias de usuario
    this.userAudioPreferences = new Map();

    this.setupHandlers();
  }

  // Obtiene las preferencias de audio de un usuario
  private getAudioPreferences(userId: number): AudioPreferences {
    if (!this.userAudioPreferences.has(userId)) {
      this.userAudioPreferences.set(userId, {
        alwaysAudio: false,
        audioForShort: true,  // Por defecto, audio para respuestas cortas
        shortResponseLimit: 300,  // 300 caracteres o menos = corto
      });
    }
    return this.userAudioPreferences.get(userId)!;
  }

  // Actualiza las preferencias de audio de un usuario
  private setAudioPreferences(userId: number, preferences: Partial<AudioPreferences>): void {
    const current = this.getAudioPreferences(userId);
    this.userAudioPreferences.set(userId, { ...current, ...preferences });
  }

  // Determina si se debe enviar audio para una respuesta
  private shouldSendAudio(userId: number, responseText: string): boolean {
    const prefs = this.getAudioPreferences(userId);

    // Si siempre audio, activar
    if (prefs.alwaysAudio) return true;

    // Si audio para cortas y la respuesta es corta
    if (prefs.audioForShort && responseText.length <= prefs.shortResponseLimit) {
      return true;
    }

    return false;
  }

  // Limpia el texto de marcas markdown para evitar problemas con TTS
  private cleanTextForTTS(text: string): string {
    return text
      .replace(/\*\*/g, '')  // Negrita
      .replace(/\*/g, '')    // Cursiva
      .replace(/__/g, '')    // Subrayado
      .replace(/~~/g, '')    // Tachado
      .replace(/`{1,3}/g, '') // Código
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')  // Enlaces [texto](url) -> texto
      .replace(/\n{3,}/g, '\n\n')  // Máximo 2 saltos de línea seguidos
      .trim();
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
        '¡Hola! Soy **AgenteDafo**, tu super asistente diario personal. 🚀\n\n' +
        '📱 *Comandos disponibles:*\n' +
        '/start - Iniciar el bot\n' +
        '/help - Mostrar ayuda\n' +
        '/clear - Limpiar el historial\n' +
        '/info - Información del bot\n' +
        '/audio_on - 🎤 Siempre responder con audio\n' +
        '/audio_off - 📝 Responder solo con texto\n' +
        '/audio_auto - 🤖 Audio automático en respuestas cortas\n' +
        '/audio_test - 🔊 Probar el sistema de audio\n' +
        '/check_eleven - 🔍 Verificar API key de ElevenLabs\n' +
        '/mis_documentos - 📁 Ver documentos subidos\n' +
        '/mis_videos - 🎥 Ver videos subidos\n' +
        '/tarea <texto> - Crear tarea rápida\n' +
        '/rutina - Ver rutina de ejercicios\n' +
        '/resumen [hoy|semana] - Resumen rápido\n\n' +
        '✨ *¿Cómo puedo ayudarte?*\n' +
        '• 📝 Envíame mensajes de texto\n' +
        '• 🎤 Envíame notas de voz (¡te respondo con audio!)\n' +
        '• 📸 Envíame imágenes para analizar\n\n' +
        '🧠 *Mis superpoderes:*\n' +
        '• Ideas y consejos personalizados\n' +
        '• Recordatorios inteligentes\n' +
        '• Búsqueda en tiempo real\n' +
        '• Gestión de tareas y rutinas\n' +
        '• Integración con Google (Drive, Calendar, Gmail)\n\n' +
        '💬 *Tip*: Envíame "¿qué puedo hacer hoy?" para comenzar.',
        { parse_mode: 'Markdown' }
      );
    });

    // Comando /help
    this.bot.command('help', (ctx) => {
      ctx.reply(
        '📖 *Ayuda de AgenteDafo - Tu Super Asistente*\n\n' +
        '🎯 *¿Qué puedo hacer por ti?*\n' +
        '• 💡 Darte ideas creativas y soluciones\n' +
        '• 📅 Organizar tu día y recordatorios\n' +
        '• 🏋️ Gestionar tus rutinas de ejercicio\n' +
        '• 🔍 Buscar información en internet\n' +
        '• 📧 Revisar tus emails y eventos\n' +
        '• 📄 Crear documentos en Drive\n\n' +
        '🎙️ *Modos de respuesta:*\n' +
        '• /audio_on - 🎤 Siempre te respondo con voz\n' +
        '• /audio_off - 📝 Solo te respondo con texto\n' +
        '• /audio_auto - 🤖 Audio automático para respuestas cortas\n\n' +
        '📋 *Comandos rápidos:*\n' +
        '• /tarea <texto> - Crea tarea al instante\n' +
        '• /rutina - Muestra tu rutina guardada\n' +
        '• /resumen [hoy|semana] - Resumen rápido\n\n' +
        '💬 *Tip*: Prueba decirme "ayúdame a organizar mi día" o "dame ideas para..."',
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
      const userId = ctx.from!.id;
      const prefs = this.getAudioPreferences(userId);

      let audioStatus = '🤖 Automático (respuestas cortas)';
      if (prefs.alwaysAudio) audioStatus = '🎤 Siempre activo';
      else if (!prefs.audioForShort) audioStatus = '📝 Desactivado';

      ctx.reply(
        'ℹ️ *AgenteDafo v2.0 - Super Asistente*\n\n' +
        `👤 Usuario: ${ctx.from!.username || ctx.from!.first_name || 'Desconocido'}\n` +
        `🆔 User ID: ${ctx.from!.id}\n` +
        `🎙️ Modo audio: ${audioStatus}\n` +
        `📏 Límite corto: ${prefs.shortResponseLimit} caracteres\n` +
        '✅ Estado: Activo\n' +
        '🧠 LLM: Groq (con fallback OpenRouter)\n' +
        '🔥 Firebase: ' + (isFirebaseAvailable() ? '✅ Conectado' : '❌ No configurado'),
        { parse_mode: 'Markdown' }
      );
    });

    // Comando /audio_on - Activar respuestas de audio siempre
    this.bot.command('audio_on', (ctx) => {
      const userId = ctx.from!.id;
      this.setAudioPreferences(userId, { alwaysAudio: true, audioForShort: true });
      ctx.reply(
        '🎙️ *Modo audio activado*\n\n' +
        '✅ Ahora te responderé con audio en **TODAS** mis respuestas.\n\n' +
        '💡 Usa /audio_off para desactivar o /audio_auto para modo inteligente.',
        { parse_mode: 'Markdown' }
      );
    });

    // Comando /audio_off - Desactivar respuestas de audio
    this.bot.command('audio_off', (ctx) => {
      const userId = ctx.from!.id;
      this.setAudioPreferences(userId, { alwaysAudio: false, audioForShort: false });
      ctx.reply(
        '📝 *Modo audio desactivado*\n\n' +
        '❌ Solo te responderé con texto.\n\n' +
        '💡 Usa /audio_on para activar o /audio_auto para modo inteligente.',
        { parse_mode: 'Markdown' }
      );
    });

    // Comando /audio_auto - Modo automático (audio para respuestas cortas)
    this.bot.command('audio_auto', (ctx) => {
      const userId = ctx.from!.id;
      this.setAudioPreferences(userId, { alwaysAudio: false, audioForShort: true });
      ctx.reply(
        '🤖 *Modo audio automático*\n\n' +
        '✅ Te responderé con audio en respuestas **cortas** (menos de ' +
        `${this.getAudioPreferences(userId).shortResponseLimit} caracteres).\n\n` +
        '💡 Usa /audio_on para siempre o /audio_off para desactivar.',
        { parse_mode: 'Markdown' }
      );
    });

    // Comando /audio_test - Probar el sistema de audio
    this.bot.command('audio_test', async (ctx) => {
      const userId = ctx.from!.id;
      await ctx.reply('🎤 Probando el sistema de audio...');

      try {
        await this.sendAudioResponse(ctx, userId, 'Hola, esto es una prueba del sistema de audio de AgenteDafo. Si escuchas este mensaje, todo funciona correctamente.');
      } catch (error) {
        await ctx.reply('❌ Error en la prueba de audio: ' + (error instanceof Error ? error.message : 'Error desconocido'));
      }
    });

    // Comando /check_eleven - Verificar API key de ElevenLabs
    this.bot.command('check_eleven', async (ctx) => {
      await ctx.reply('🔍 Verificando API key de ElevenLabs...');

      const apiKey = config.elevenlabs.apiKey;

      if (!apiKey) {
        await ctx.reply(
          '❌ *ELEVENLABS_API_KEY no configurada*\n\n' +
          'Agrega esta variable a tu archivo .env:\n' +
          '`ELEVENLABS_API_KEY=tu_key_aqui`\n\n' +
          'Obtén tu key en: https://elevenlabs.io/app/settings/api-keys',
          { parse_mode: 'Markdown' }
        );
        return;
      }

      // Mostrar primeros caracteres de la key (ocultando el resto)
      const maskedKey = apiKey.substring(0, 8) + '...' + apiKey.substring(apiKey.length - 4);
      await ctx.reply(`🔑 Key configurada: ${maskedKey}`);

      // Verificar la key con ElevenLabs
      const result = await verifyApiKey(apiKey);

      if (result.valid) {
        await ctx.reply(
          '✅ *API Key válida*\n\n' +
          `🎤 Voz configurada: ${config.elevenlabs.voiceId}\n` +
          `📢 Modelo: ${config.elevenlabs.model}\n\n` +
          'ElevenLabs está funcionando correctamente.',
          { parse_mode: 'Markdown' }
        );
      } else {
        await ctx.reply(
          '❌ *Error con la API Key*\n\n' +
          `🔍 Detalle: ${result.error}\n\n` +
          'Soluciones posibles:\n' +
          '• La key puede estar expirada\n' +
          '• La key puede ser incorrecta\n' +
          '• Puede haber un problema con tu cuenta de ElevenLabs\n\n' +
          'Verifica en: https://elevenlabs.io/app/settings/api-keys',
          { parse_mode: 'Markdown' }
        );
      }
    });

    // Comando /mis_documentos - Lista documentos subidos
    this.bot.command('mis_documentos', async (ctx) => {
      const userId = ctx.from!.id;

      try {
        const { searchNotes } = await import('../personal/notes.js');
        const documentos = await searchNotes(userId.toString(), 'documentos_telegram');

        // Contar cuántos hay
        const lineas = documentos.split('\n');
        const count = lineas.filter(l => l.includes('📄 Documento:')).length;

        if (count === 0) {
          await ctx.reply(
            '📁 *Mis Documentos*\n\n' +
            'No tienes documentos guardados.\n\n' +
            '💡 Envíame un documento (PDF, DOCX, TXT, etc.) y lo guardaré automáticamente en Google Drive.',
            { parse_mode: 'Markdown' }
          );
        } else {
          await ctx.reply(
            `📁 *Mis Documentos* (${count} archivos)\n\n${documentos}\n\n` +
            '💡 Los documentos están guardados en Google Drive.',
            { parse_mode: 'Markdown' }
          );
        }
      } catch (error) {
        await ctx.reply('❌ Error al listar documentos: ' + (error instanceof Error ? error.message : 'Error desconocido'));
      }
    });

    // Comando /mis_videos - Lista videos subidos
    this.bot.command('mis_videos', async (ctx) => {
      const userId = ctx.from!.id;

      try {
        const { searchNotes } = await import('../personal/notes.js');
        const videos = await searchNotes(userId.toString(), 'videos_telegram');

        const lineas = videos.split('\n');
        const count = lineas.filter(l => l.includes('🎥 Video:')).length;

        if (count === 0) {
          await ctx.reply(
            '🎥 *Mis Videos*\n\n' +
            'No tienes videos guardados.\n\n' +
            '💡 Envíame un video y lo guardaré automáticamente en Google Drive.',
            { parse_mode: 'Markdown' }
          );
        } else {
          await ctx.reply(
            `🎥 *Mis Videos* (${count} videos)\n\n${videos}\n\n` +
            '💡 Los videos están guardados en Google Drive.',
            { parse_mode: 'Markdown' }
          );
        }
      } catch (error) {
        await ctx.reply('❌ Error al listar videos: ' + (error instanceof Error ? error.message : 'Error desconocido'));
      }
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

    // Manejar documentos (PDF, DOCX, etc.)
    this.bot.on('message:document', async (ctx) => {
      await this.handleDocumentMessage(ctx);
    });

    // Manejar video
    this.bot.on('message:video', async (ctx) => {
      await this.handleVideoMessage(ctx);
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
        // Determinar si enviar audio basado en preferencias del usuario
        const shouldSendAudio = this.shouldSendAudio(userId, result.response);

        if (shouldSendAudio) {
          // Enviar texto Y audio
          await ctx.reply(result.response);
          await this.sendAudioResponse(ctx, userId, result.response);
        } else {
          // Enviar solo texto
          await ctx.reply(result.response);
        }
      }

    } catch (error) {
      console.error('Error procesando mensaje:', error);
      await ctx.reply(
        '❌ Ocurrió un error al procesar tu mensaje. Por favor, inténtalo de nuevo.'
      );
    }
  }

  // Envía respuesta de audio usando ElevenLabs
  private async sendAudioResponse(ctx: Context, userId: number, text: string): Promise<void> {
    const responseAudioPath = join(tmpdir(), `response_${Date.now()}.mp3`);

    try {
      await ctx.api.sendChatAction(userId, 'record_voice');

      // Limpiar texto para TTS
      const cleanText = this.cleanTextForTTS(text);

      console.log('🎤 Generando audio con ElevenLabs...');

      // Generar audio con ElevenLabs
      await textToSpeech(cleanText, responseAudioPath, {
        apiKey: config.elevenlabs.apiKey,
        voiceId: config.elevenlabs.voiceId,
        model: config.elevenlabs.model,
      });

      console.log('✅ Audio generado, enviando a Telegram...');

      // Crear un stream del archivo
      const audioStream = createReadStream(responseAudioPath);

      // Enviar el audio como nota de voz usando InputFile
      await ctx.replyWithVoice(new InputFile(audioStream, 'response.mp3'));

      console.log('✅ Audio enviado correctamente');

    } catch (error) {
      // Si falla la generación de audio, loggear pero no fallar el flujo
      console.warn('⚠️  Error generando audio con ElevenLabs:', error);
      await ctx.reply('🎤 *No puedo enviar audio en este momento.*\n\n' +
        'Verifica que ELEVENLABS_API_KEY esté configurada correctamente.',
        { parse_mode: 'Markdown' }
      );
    } finally {
      // Limpiar el archivo temporal (usar el MISMO nombre de archivo)
      try {
        await unlink(responseAudioPath);
        console.log('🗑️ Archivo temporal eliminado');
      } catch (err) {
        console.warn('⚠️  Error eliminando archivo temporal:', err);
      }
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

  /**
   * Maneja documentos subidos por el usuario (PDF, DOCX, TXT, etc.)
   * Los sube a Google Drive y guarda metadatos en la BD local
   */
  private async handleDocumentMessage(ctx: Context): Promise<void> {
    const userId = ctx.from!.id;
    const username = ctx.from!.username || ctx.from!.first_name || undefined;
    const document = ctx.message?.document;

    if (!document) {
      return;
    }

    await ctx.api.sendChatAction(userId, 'upload_document');

    try {
      // Obtener información del archivo
      const file = await ctx.api.getFile(document.file_id);
      const fileName = document.file_name || `documento_${Date.now()}`;
      const fileSize = document.file_size || 0;
      const mimeType = document.mime_type || 'application/octet-stream';

      // Descargar el archivo
      const fileUrl = `https://api.telegram.org/file/bot${config.telegram.botToken}/${file.file_path}`;
      const response = await fetch(fileUrl);

      if (!response.ok) {
        throw new Error('Error al descargar el documento de Telegram');
      }

      const fileBuffer = Buffer.from(await response.arrayBuffer());

      // Determinar el tipo MIME correcto para Google Drive
      let driveMimeType = mimeType;
      const fileNameLower = fileName.toLowerCase();

      if (fileNameLower.endsWith('.pdf')) {
        driveMimeType = 'application/pdf';
      } else if (fileNameLower.endsWith('.docx') || fileNameLower.endsWith('.doc')) {
        driveMimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      } else if (fileNameLower.endsWith('.xlsx') || fileNameLower.endsWith('.xls')) {
        driveMimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      } else if (fileNameLower.endsWith('.txt')) {
        driveMimeType = 'text/plain';
      } else if (fileNameLower.endsWith('.odt')) {
        driveMimeType = 'application/vnd.oasis.opendocument.text';
      }

      // Subir a Google Drive
      const { uploadFileBuffer } = await import('../google/drive.js');
      const driveResult = await uploadFileBuffer(fileName, driveMimeType, fileBuffer);

      // Guardar metadatos en la BD local (usando personal notes)
      const metadata = {
        fileName,
        fileSize,
        mimeType: driveMimeType,
        uploadedAt: new Date().toISOString(),
        source: 'telegram',
        userId: userId.toString(),
      };

      // Guardar como nota personal con la información del documento
      const { saveNote } = await import('../personal/notes.js');
      await saveNote(
        userId.toString(),
        `📄 Documento: ${fileName}`,
        `Documento subido desde Telegram\n\n${driveResult}\n\nMetadatos: ${JSON.stringify(metadata, null, 2)}`,
        'documentos_telegram'
      );

      // Guardar en ChatDafo
      await this.saveToChatDafo(userId, username, 'user', `📄 Documento subido: ${fileName}`);
      await this.saveToChatDafo(userId, username, 'assistant', driveResult);

      // Responder al usuario
      const sizeMB = (fileSize / (1024 * 1024)).toFixed(2);
      await ctx.reply(
        `✅ *Documento subido a Google Drive*\n\n` +
        `📄 **${fileName}**\n` +
        `📏 Tamaño: ${sizeMB} MB\n` +
        `📁 Guardado en: Google Drive\n\n` +
        `${driveResult}`,
        { parse_mode: 'Markdown' }
      );

    } catch (error) {
      console.error('Error procesando documento:', error);
      await ctx.reply(
        '❌ Error al procesar el documento: ' + (error instanceof Error ? error.message : 'Error desconocido')
      );
    }
  }

  /**
   * Maneja videos subidos por el usuario
   * Los sube a Google Drive y guarda metadatos
   */
  private async handleVideoMessage(ctx: Context): Promise<void> {
    const userId = ctx.from!.id;
    const video = ctx.message?.video;

    if (!video) {
      return;
    }

    await ctx.api.sendChatAction(userId, 'upload_video');

    try {
      // Obtener información del archivo
      const file = await ctx.api.getFile(video.file_id);
      const fileName = `video_${Date.now()}.mp4`;
      const fileSize = video.file_size || 0;

      // Descargar el archivo
      const fileUrl = `https://api.telegram.org/file/bot${config.telegram.botToken}/${file.file_path}`;
      const response = await fetch(fileUrl);

      if (!response.ok) {
        throw new Error('Error al descargar el video de Telegram');
      }

      const fileBuffer = Buffer.from(await response.arrayBuffer());

      // Subir a Google Drive
      const { uploadFileBuffer } = await import('../google/drive.js');
      const driveResult = await uploadFileBuffer(fileName, 'video/mp4', fileBuffer);

      // Guardar metadatos
      const { saveNote } = await import('../personal/notes.js');
      const sizeMB = (fileSize / (1024 * 1024)).toFixed(2);
      await saveNote(
        userId.toString(),
        `🎥 Video: ${fileName}`,
        `Video subido desde Telegram (${sizeMB} MB)\n\n${driveResult}`,
        'videos_telegram'
      );

      await ctx.reply(
        `✅ *Video subido a Google Drive*\n\n` +
        `🎥 ${fileName}\n` +
        `📏 Tamaño: ${sizeMB} MB\n\n` +
        `${driveResult}`,
        { parse_mode: 'Markdown' }
      );

    } catch (error) {
      console.error('Error procesando video:', error);
      await ctx.reply(
        '❌ Error al procesar el video: ' + (error instanceof Error ? error.message : 'Error desconocido')
      );
    }
  }

  /**
   * Mejora el handler de fotos para también subirlas a Drive
   */
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

        // SUBIR A GOOGLE DRIVE
        try {
          const { uploadFileBuffer } = await import('../google/drive.js');
          const fileName = `foto_${Date.now()}.jpg`;
          const driveResult = await uploadFileBuffer(fileName, 'image/jpeg', imageBuffer);

          await ctx.reply(`📸 *Foto subida a Google Drive*\n\n${driveResult}`, { parse_mode: 'Markdown' });
        } catch (driveError) {
          console.warn('⚠️ No se pudo subir a Drive, continuando con análisis:', driveError);
        }

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
