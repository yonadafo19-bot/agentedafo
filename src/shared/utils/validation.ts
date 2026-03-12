/**
 * Utilidades de validación
 */

/**
 * Valida un email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Valida un número de teléfono
 */
export function isValidPhone(phone: string): boolean {
  // Acepta formatos: +1234567890, 123-456-7890, (123) 456-7890
  const phoneRegex = /^\+?[\d\s\-()]{10,}$/;
  return phoneRegex.test(phone);
}

/**
 * Valida una URL
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Valida que un string no esté vacío
 */
export function isNotEmpty(value: string): boolean {
  return value.trim().length > 0;
}

/**
 * Valida la longitud de un string
 */
export function isLength(
  value: string,
  min: number,
  max?: number
): boolean {
  const length = value.length;
  if (max === undefined) {
    return length >= min;
  }
  return length >= min && length <= max;
}

/**
 * Valida que un número esté en un rango
 */
export function isInRange(
  value: number,
  min: number,
  max: number
): boolean {
  return value >= min && value <= max;
}

/**
 * Valida un ID de Telegram
 */
export function isValidTelegramId(id: string | number): boolean {
  const numId = typeof id === 'string' ? parseInt(id, 10) : id;
  return !isNaN(numId) && numId > 0;
}

/**
 * Valida un token de Telegram
 */
export function isValidTelegramToken(token: string): boolean {
  // Formato: botid:hash (ej: 123456789:ABCdefGHIjklMNOpqrsTUVwxyz)
  const tokenRegex = /^\d+:[A-Za-z0-9_-]{35}$/;
  return tokenRegex.test(token);
}

/**
 * Valida un nombre de usuario (username)
 */
export function isValidUsername(username: string): boolean {
  // Telegram usernames: 5-32 caracteres, solo letras, números, guiones bajos
  const usernameRegex = /^[a-zA-Z][a-zA-Z0-9_]{4,31}$/;
  return usernameRegex.test(username);
}

/**
 * Valida que un archivo sea de un tipo permitido
 */
export function isAllowedFileType(
  filename: string,
  allowedTypes: string[]
): boolean {
  const ext = filename.split('.').pop()?.toLowerCase();
  return ext !== undefined && allowedTypes.includes(`.${ext}`);
}

/**
 * Valida el tamaño de un archivo
 */
export function isValidFileSize(
  sizeBytes: number,
  maxSizeMB: number
): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return sizeBytes <= maxSizeBytes;
}
