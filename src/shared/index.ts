/**
 * @module shared
 * @description Módulo compartido con utilidades, tipos y constantes
 *
 * Este módulo contiene código reutilizable en toda la aplicación.
 * Está organizado en submódulos por responsabilidad.
 *
 * @example
 * ```typescript
 * import { BaseError, ErrorCode } from '@/shared/errors.js';
 * import { formatDate, isValidEmail } from '@/shared/utils/index.js';
 * import { LIMITS, MESSAGES } from '@/shared/constants/index.js';
 * ```
 */

// Errores
export * from './errors/index.js';

// Utilidades
export * from './utils/index.js';

// Constantes
export * from './constants/index.js';

// Tipos
export * from './types/index.js';
