/**
 * Constantes compartidas - Valores inmutables usados en toda la aplicación
 */

export * from './errors.js';
export * from './limits.js';
export * from './messages.js';

/**
 * Versión de la aplicación
 */
export const APP_VERSION = '2.0.0';

/**
 * Entorno de ejecución
 */
export const ENVIRONMENT = process.env.NODE_ENV || 'development';

/**
 * Si está en modo desarrollo
 */
export const IS_DEVELOPMENT = ENVIRONMENT === 'development';

/**
 * Si está en modo producción
 */
export const IS_PRODUCTION = ENVIRONMENT === 'production';

/**
 * Si está en modo test
 */
export const IS_TEST = ENVIRONMENT === 'test';

/**
 * Formatos de fecha
 */
export const DATE_FORMATS = {
  FULL: 'YYYY-MM-DD HH:mm:ss',
  DATE: 'YYYY-MM-DD',
  TIME: 'HH:mm:ss',
  PRETTY: 'DD/MM/YYYY HH:mm',
  PRETTY_DATE: 'DD/MM/YYYY',
  PRETTY_TIME: 'HH:mm',
} as const;

/**
 * Zonas horarias comunes
 */
export const TIMEZONES = {
  MADRID: 'Europe/Madrid',
  MEXICO_CITY: 'America/Mexico_City',
  BUENOS_AIRES: 'America/Argentina/Buenos_Aires',
  LIMA: 'America/Lima',
  BOGOTA: 'America/Bogota',
  NEW_YORK: 'America/New_York',
  LOS_ANGELES: 'America/Los_Angeles',
} as const;
