/**
 * Constantes de error - Mensajes y códigos consistentes
 */

export const ERROR_MESSAGES = {
  // Autenticación
  UNAUTHORIZED: 'Usuario no autorizado para realizar esta acción',
  INVALID_CREDENTIALS: 'Credenciales inválidas',
  TOKEN_EXPIRED: 'La sesión ha expirado. Por favor, inicia sesión nuevamente',
  TOKEN_INVALID: 'Token de autenticación inválido',

  // Validación
  REQUIRED_FIELD: 'El campo es requerido',
  INVALID_EMAIL: 'Formato de email inválido',
  INVALID_PHONE: 'Formato de teléfono inválido',
  INVALID_URL: 'Formato de URL inválido',

  // Base de datos
  RECORD_NOT_FOUND: 'Registro no encontrado',
  DUPLICATE_ENTRY: 'Ya existe un registro con estos datos',
  DATABASE_ERROR: 'Error al acceder a la base de datos',

  // Integraciones
  LLM_UNAVAILABLE: 'Servicio de IA no disponible temporalmente',
  TELEGRAM_API_ERROR: 'Error al comunicarse con Telegram',
  GOOGLE_AUTH_EXPIRED: 'La sesión con Google ha expirado',

  // Negocio
  QUOTA_EXCEEDED: 'Has excedido tu cuota',
  OPERATION_NOT_ALLOWED: 'Operación no permitida',
} as const;

export const ERROR_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;
