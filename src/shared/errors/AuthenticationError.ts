/**
 * AuthenticationError - Errores relacionados con autenticación y autorización
 */

import { BaseError, ErrorCode, ErrorSeverity } from './BaseError.js';

export class UnauthorizedError extends BaseError {
  constructor(message = 'Usuario no autorizado', context = {}) {
    super(message, ErrorCode.UNAUTHORIZED, ErrorSeverity.HIGH, context);
  }
}

export class ForbiddenError extends BaseError {
  constructor(message = 'Acceso prohibido', context = {}) {
    super(message, ErrorCode.FORBIDDEN, ErrorSeverity.HIGH, context);
  }
}

export class InvalidTokenError extends BaseError {
  constructor(message = 'Token inválido', context = {}) {
    super(message, ErrorCode.INVALID_TOKEN, ErrorSeverity.MEDIUM, context);
  }
}

export class TokenExpiredError extends BaseError {
  constructor(message = 'Token expirado', context = {}) {
    super(message, ErrorCode.TOKEN_EXPIRED, ErrorSeverity.MEDIUM, context);
  }
}
