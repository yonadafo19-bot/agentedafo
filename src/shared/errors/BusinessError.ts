/**
 * BusinessError - Errores de reglas de negocio
 */

import { BaseError, ErrorCode, ErrorSeverity } from './BaseError.js';

export class BusinessRuleViolationError extends BaseError {
  constructor(rule: string, message: string, context = {}) {
    super(
      `Violación de regla de negocio (${rule}): ${message}`,
      ErrorCode.BUSINESS_RULE_VIOLATION,
      ErrorSeverity.MEDIUM,
      { rule, ...context }
    );
  }
}

export class QuotaExceededError extends BaseError {
  constructor(
    resource: string,
    current: number,
    limit: number,
    context = {}
  ) {
    super(
      `Cuota excedida para ${resource}: ${current}/${limit}`,
      ErrorCode.QUOTA_EXCEEDED,
      ErrorSeverity.MEDIUM,
      { resource, current, limit, ...context }
    );
  }
}

export class OperationNotAllowedError extends BaseError {
  constructor(operation: string, reason: string, context = {}) {
    super(
      `Operación no permitida: ${operation}. Razón: ${reason}`,
      ErrorCode.OPERATION_NOT_ALLOWED,
      ErrorSeverity.MEDIUM,
      { operation, reason, ...context }
    );
  }
}
