/**
 * DatabaseError - Errores relacionados con la base de datos
 */

import { BaseError, ErrorCode, ErrorSeverity } from './BaseError.js';

export class DatabaseError extends BaseError {
  constructor(
    message = 'Error de base de datos',
    originalError?: Error,
    context = {}
  ) {
    super(
      message,
      ErrorCode.DATABASE_ERROR,
      ErrorSeverity.HIGH,
      context,
      originalError
    );
  }
}

export class RecordNotFoundError extends BaseError {
  constructor(entity: string, identifier: string, context = {}) {
    super(
      `${entity} no encontrado: ${identifier}`,
      ErrorCode.RECORD_NOT_FOUND,
      ErrorSeverity.LOW,
      { entity, identifier, ...context }
    );
  }
}

export class DuplicateRecordError extends BaseError {
  constructor(entity: string, field: string, value: string, context = {}) {
    super(
      `${entity} duplicado: ${field} = ${value}`,
      ErrorCode.DUPLICATE_RECORD,
      ErrorSeverity.MEDIUM,
      { entity, field, value, ...context }
    );
  }
}

export class ConnectionFailedError extends BaseError {
  constructor(
    message = 'Fallo de conexión a la base de datos',
    originalError?: Error
  ) {
    super(
      message,
      ErrorCode.CONNECTION_FAILED,
      ErrorSeverity.CRITICAL,
      {},
      originalError
    );
  }
}
