/**
 * Google Workspace Integration
 * Punto de entrada para todos los servicios de Google
 */

export * from './oauth.js';
export * from './gmail.js';
export * from './calendar.js';
export * from './drive.js';
export { readGoogleDoc, searchAndReadDoc } from './drive.js';
