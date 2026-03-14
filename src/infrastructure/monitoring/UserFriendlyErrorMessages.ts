/**
 * User-Friendly Error Messages
 * Mensajes de error específicos y accionables para el usuario
 */

import { ErrorCode } from '../../shared/errors/index.js';

export interface ErrorSolution {
  title: string;
  message: string;
  solution?: string;
  emoji: string;
}

/**
 * Mapa de códigos de error a mensajes amigables
 */
const ERROR_MESSAGES: Record<string, ErrorSolution> = {
  // Errores de autenticación
  [ErrorCode.UNAUTHORIZED]: {
    emoji: '🔐',
    title: 'No autorizado',
    message: 'No tienes permiso para realizar esta acción.',
    solution: 'Verifica que estás usando el usuario correcto de Telegram.',
  },
  [ErrorCode.FORBIDDEN]: {
    emoji: '⛔',
    title: 'Acceso denegado',
    message: 'No tienes acceso a este recurso.',
    solution: 'Si crees que es un error, contacta al administrador.',
  },
  [ErrorCode.INVALID_TOKEN]: {
    emoji: '🔑',
    title: 'Token inválido',
    message: 'Tu sesión ha expirado o el token es inválido.',
    solution: 'Reinicia el bot con /start para obtener una nueva sesión.',
  },
  [ErrorCode.TOKEN_EXPIRED]: {
    emoji: '⏰',
    title: 'Sesión expirada',
    message: 'Tu sesión ha caducado.',
    solution: 'Usa /start para iniciar una nueva sesión.',
  },

  // Errores de validación
  [ErrorCode.VALIDATION_ERROR]: {
    emoji: '⚠️',
    title: 'Datos inválidos',
    message: 'Algunos datos proporcionados no son correctos.',
    solution: 'Verifica la información e intenta de nuevo.',
  },
  [ErrorCode.INVALID_INPUT]: {
    emoji: '📝',
    title: 'Entrada inválida',
    message: 'El formato de lo que escribiste no es correcto.',
    solution: 'Intenta ser más específico o usa un formato diferente.',
  },
  [ErrorCode.MISSING_REQUIRED_FIELD]: {
    emoji: '❓',
    title: 'Falta información',
    message: 'Hace falta algún dato requerido.',
    solution: 'Proporciona todos los datos necesarios.',
  },

  // Errores de base de datos
  [ErrorCode.DATABASE_ERROR]: {
    emoji: '💾',
    title: 'Error de base de datos',
    message: 'Hubo un problema guardando tu información.',
    solution: 'Intenta de nuevo en unos segundos.',
  },
  [ErrorCode.RECORD_NOT_FOUND]: {
    emoji: '🔍',
    title: 'No encontrado',
    message: 'No encontré lo que buscabas.',
    solution: 'Verifica que el nombre o ID sea correcto.',
  },
  [ErrorCode.DUPLICATE_RECORD]: {
    emoji: '📋',
    title: 'Ya existe',
    message: 'Este elemento ya está creado.',
    solution: 'Usa un nombre diferente o edita el existente.',
  },
  [ErrorCode.CONNECTION_FAILED]: {
    emoji: '🔌',
    title: 'Sin conexión',
    message: 'No puedo conectar con la base de datos.',
    solution: 'Espera unos momentos y vuelve a intentar.',
  },

  // Errores de integraciones
  [ErrorCode.LLM_PROVIDER_ERROR]: {
    emoji: '🤖',
    title: 'Error del servicio de IA',
    message: 'El servicio de inteligencia artificial no está respondiendo.',
    solution: 'Espera unos segundos y vuelve a intentar. Si persiste, usa /report.',
  },
  [ErrorCode.TELEGRAM_API_ERROR]: {
    emoji: '📱',
    title: 'Error de Telegram',
    message: 'Hubo un problema comunicando con Telegram.',
    solution: 'Vuelve a intentar. Si continúa, reporta el error.',
  },
  [ErrorCode.GOOGLE_API_ERROR]: {
    emoji: '🔵',
    title: 'Error de Google',
    message: 'No pude conectar con los servicios de Google.',
    solution: 'Verifica que hayas dado permisos al bot o intenta de nuevo.',
  },
  [ErrorCode.FIREBASE_ERROR]: {
    emoji: '🔥',
    title: 'Error de base de datos',
    message: 'Error accediendo a la base de datos.',
    solution: 'Vuelve a intentar en unos segundos.',
  },

  // Errores de negocio
  [ErrorCode.BUSINESS_RULE_VIOLATION]: {
    emoji: '📜',
    title: 'Operación no permitida',
    message: 'Esta acción no está permitida por las reglas del sistema.',
    solution: 'Si crees que es un error, contacta al administrador.',
  },
  [ErrorCode.QUOTA_EXCEEDED]: {
    emoji: '📊',
    title: 'Límite alcanzado',
    message: 'Has alcanzado el límite de uso para esta función.',
    solution: 'Espera un poco antes de volver a usar esta función.',
  },
  [ErrorCode.OPERATION_NOT_ALLOWED]: {
    emoji: '🚫',
    title: 'Operación no permitida',
    message: 'No puedes realizar esta acción en este momento.',
    solution: 'Vuelve a intentarlo más tarde.',
  },

  // Errores del sistema
  [ErrorCode.INTERNAL_ERROR]: {
    emoji: '⚡',
    title: 'Error interno',
    message: 'Ocurrió un error inesperado.',
    solution: 'Intenta de nuevo. Si el problema persiste, usa /report.',
  },
  [ErrorCode.SERVICE_UNAVAILABLE]: {
    emoji: '😴',
    title: 'Servicio no disponible',
    message: 'El servicio está temporalmente no disponible.',
    solution: 'Vuelve a intentar en unos minutos.',
  },
  [ErrorCode.TIMEOUT]: {
    emoji: '⏳',
    title: 'Tiempo de espera agotado',
    message: 'La operación tomó demasiado tiempo.',
    solution: 'Intenta con una solicitud más simple o vuelve a intentar.',
  },
};

/**
 * Errores específicos de API con soluciones detalladas
 */
const API_ERROR_MESSAGES: Record<string, ErrorSolution> = {
  'GROQ_RATE_LIMIT': {
    emoji: '🚦',
    title: 'Demasiadas solicitudes',
    message: 'Has enviado demasiadas solicitudes en poco tiempo.',
    solution: 'Espera unos 30 segundos antes de volver a preguntar.',
  },
  'GROQ_API_KEY_INVALID': {
    emoji: '🔑',
    title: 'API Key inválida',
    message: 'La clave de la API de Groq no es válida.',
    solution: 'Verifica tu configuración o contacta al administrador.',
  },
  'OPENAI_RATE_LIMIT': {
    emoji: '🚦',
    title: 'Límite de OpenAI',
    message: 'Has alcanzado el límite de la API de OpenAI.',
    solution: 'Espera un momento o usa otro modelo.',
  },
  'GOOGLE_AUTH_EXPIRED': {
    emoji: '🔑',
    title: 'Google: Sesión expirada',
    message: 'Tu sesión con Google ha expirado.',
    solution: 'Usa /google para autenticarte de nuevo.',
  },
  'GOOGLE_PERMISSION_DENIED': {
    emoji: '🚫',
    title: 'Google: Permiso denegado',
    message: 'No has dado permiso al bot para acceder a este servicio de Google.',
    solution: 'Usa /google y verifica los permisos solicitados.',
  },
  'GOOGLE_QUOTA_EXCEEDED': {
    emoji: '📊',
    title: 'Google: Cuota excedida',
    message: 'Has alcanzado el límite de la API de Google.',
    solution: 'Espera un poco antes de volver a usar esta función.',
  },
  'TELEGRAM_FILE_TOO_LARGE': {
    emoji: '📁',
    title: 'Archivo muy grande',
    message: 'El archivo es demasiado grande para Telegram.',
    solution: 'Usa un archivo más pequeño (máx 20MB para fotos, 50MB para documentos).',
  },
  'TELEGRAM_DOWNLOAD_FAILED': {
    emoji: '⬇️',
    title: 'Error descargando archivo',
    message: 'No pude descargar el archivo.',
    solution: 'Vuelve a enviar el archivo o intenta con uno diferente.',
  },
  'FIRESTORE_WRITE_FAILED': {
    emoji: '💾',
    title: 'Error guardando datos',
    message: 'No pude guardar la información en la base de datos.',
    solution: 'Vuelve a intentar. Si persiste, es posible que haya un problema de conexión.',
  },
};

/**
 * Obtiene un mensaje de error amigable
 */
export function getUserFriendlyMessage(
  errorCode: string,
  originalMessage?: string
): ErrorSolution {
  // Primero buscar en errores específicos de API
  if (API_ERROR_MESSAGES[errorCode]) {
    return API_ERROR_MESSAGES[errorCode];
  }

  // Luego buscar en errores generales
  if (ERROR_MESSAGES[errorCode]) {
    return ERROR_MESSAGES[errorCode];
  }

  // Si no hay mensaje específico, retornar uno genérico
  return {
    emoji: '⚠️',
    title: 'Error inesperado',
    message: originalMessage || 'Ocurrió un error inesperado.',
    solution: 'Intenta de nuevo. Si el problema persiste, usa /report para notificar.',
  };
}

/**
 * Detecta errores comunes a partir de mensajes de error
 */
export function detectCommonError(error: Error): string | null {
  const message = error.message.toLowerCase();

  // Detección de errores de rate limit
  if (message.includes('rate limit') || message.includes('too many requests')) {
    if (message.includes('groq')) return 'GROQ_RATE_LIMIT';
    if (message.includes('openai')) return 'OPENAI_RATE_LIMIT';
    if (message.includes('google')) return 'GOOGLE_QUOTA_EXCEEDED';
  }

  // Detección de errores de autenticación
  if (message.includes('invalid api key') || message.includes('unauthorized')) {
    if (message.includes('groq')) return 'GROQ_API_KEY_INVALID';
  }

  // Detección de errores de Google
  if (message.includes('token expired') || message.includes('invalid_token')) {
    return 'GOOGLE_AUTH_EXPIRED';
  }
  if (message.includes('permission denied') || message.includes('access denied')) {
    return 'GOOGLE_PERMISSION_DENIED';
  }

  // Detección de errores de Telegram
  if (message.includes('file too large') || message.includes('file is too big')) {
    return 'TELEGRAM_FILE_TOO_LARGE';
  }
  if (message.includes('download') && message.includes('failed')) {
    return 'TELEGRAM_DOWNLOAD_FAILED';
  }

  // Detección de errores de Firebase
  if (message.includes('firestore') && message.includes('permission denied')) {
    return 'FIRESTORE_WRITE_FAILED';
  }

  return null;
}

/**
 * Formatea un error para mostrar al usuario en Telegram
 */
export function formatErrorForTelegram(error: Error | string): string {
  let errorCode: string;
  let originalMessage: string;

  if (typeof error === 'string') {
    errorCode = 'INTERNAL_ERROR';
    originalMessage = error;
  } else {
    // Intentar detectar el error específico
    const detectedCode = detectCommonError(error);
    errorCode = detectedCode || 'INTERNAL_ERROR';
    originalMessage = error.message;
  }

  const friendlyMessage = getUserFriendlyMessage(errorCode, originalMessage);

  let text = `${friendlyMessage.emoji} *${friendlyMessage.title}*\n\n`;
  text += `${friendlyMessage.message}`;

  if (friendlyMessage.solution) {
    text += `\n\n💡 *Solución:* ${friendlyMessage.solution}`;
  }

  return text;
}

/**
 * Crea una respuesta de error para el bot
 */
export function createErrorResponse(
  error: Error | string,
  context?: { userId?: string; action?: string }
): { text: string; shouldLog: boolean; logLevel: 'info' | 'warn' | 'error' } {
  const text = formatErrorForTelegram(error);

  // Determinar nivel de logging basado en el tipo de error
  const isCommon = typeof error !== 'string' && detectCommonError(error) !== null;
  const logLevel = isCommon ? 'info' : 'error';
  const shouldLog = !isCommon; // No loggear errores comunes

  return {
    text,
    shouldLog,
    logLevel,
  };
}
