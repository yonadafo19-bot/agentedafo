/**
 * Utilidades de manipulación de strings
 */

/**
 * Trunca un texto a una longitud máxima
 */
export function truncate(text: string, maxLength: number, suffix = '...'): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength - suffix.length) + suffix;
}

/**
 * Capitaliza la primera letra
 */
export function capitalize(text: string): string {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

/**
 * Convierte a slug (URL-friendly)
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD') // Descomponer caracteres acentuados
    .replace(/[\u0300-\u036f]/g, '') // Eliminar diacríticos
    .replace(/[^\w\s-]/g, '') // Eliminar caracteres no alfanuméricos
    .replace(/\s+/g, '-') // Reemplazar espacios con guiones
    .replace(/--+/g, '-') // Reemplazar múltiples guiones con uno solo
    .trim();
}

/**
 * Escapa caracteres especiales de Markdown
 */
export function escapeMarkdown(text: string): string {
  const specialChars = ['*', '_', '[', ']', '(', ')', '~', '`', '>', '#', '+', '-', '=', '|', '{', '}', '.', '!'];
  let result = text;
  for (const char of specialChars) {
    result = result.replace(new RegExp(`\\${char}`, 'g'), `\\${char}`);
  }
  return result;
}

/**
 * Extrae emojis de un texto
 */
export function extractEmojis(text: string): string[] {
  const emojiRegex = /\p{Emoji}/gu;
  return text.match(emojiRegex) || [];
}

/**
 * Elimina emojis de un texto
 */
export function removeEmojis(text: string): string {
  return text.replace(/\p{Emoji}/gu, '');
}

/**
 * Cuenta las palabras en un texto
 */
export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Genera un ID corto aleatorio
 */
export function generateId(length = 8): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Normaliza un string para comparación (ignora acentos, mayúsculas, etc.)
 */
export function normalizeForComparison(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Verifica si un string contiene otro (insensible a mayúsculas y acentos)
 */
export function includesIgnoreCase(haystack: string, needle: string): boolean {
  return normalizeForComparison(haystack).includes(normalizeForComparison(needle));
}

/**
 * Enmascara información sensible (para logs)
 */
export function maskSensitive(text: string, visibleChars = 4, maskChar = '*'): string {
  if (text.length <= visibleChars) {
    return maskChar.repeat(text.length);
  }
  const start = text.substring(0, visibleChars / 2);
  const end = text.substring(text.length - visibleChars / 2);
  const middle = maskChar.repeat(Math.max(text.length - visibleChars, 3));
  return start + middle + end;
}
