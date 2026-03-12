/**
 * ValidationError - Errores de validación de datos
 */

import { BaseError, ErrorCode, ErrorSeverity } from './BaseError.js';

export interface ValidationErrorDetails {
  field: string;
  message: string;
  value?: unknown;
}

export class ValidationError extends BaseError {
  public readonly details: ValidationErrorDetails[];

  constructor(
    message = 'Error de validación',
    details: ValidationErrorDetails[] = [],
    context = {}
  ) {
    super(message, ErrorCode.VALIDATION_ERROR, ErrorSeverity.LOW, {
      ...context,
      details,
    });
    this.details = details;
  }

  static forField(field: string, message: string, value?: unknown): ValidationError {
    return new ValidationError('Error de validación', [
      { field, message, value },
    ]);
  }

  static required(field: string): ValidationError {
    return ValidationError.forField(field, `El campo '${field}' es requerido`);
  }

  static invalidFormat(field: string, format: string): ValidationError {
    return ValidationError.forField(
      field,
      `Formato inválido. Se esperaba: ${format}`
    );
  }

  static outOfRange(
    field: string,
    value: number,
    min: number,
    max: number
  ): ValidationError {
    return ValidationError.forField(
      field,
      `Valor fuera de rango. Debe estar entre ${min} y ${max}`,
      value
    );
  }
}

export class InvalidInputError extends BaseError {
  constructor(message = 'Entrada inválida', context = {}) {
    super(message, ErrorCode.INVALID_INPUT, ErrorSeverity.LOW, context);
  }
}

export class MissingRequiredFieldError extends BaseError {
  constructor(field: string, context = {}) {
    super(
      `Campo requerido faltante: ${field}`,
      ErrorCode.MISSING_REQUIRED_FIELD,
      ErrorSeverity.MEDIUM,
      { field, ...context }
    );
  }
}
