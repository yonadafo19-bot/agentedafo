/**
 * BaseError - Clase base para todos los errores de la aplicación
 * Proporciona un manejo de errores consistente y estructurado
 */

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum ErrorCode {
  // Errores de autenticación (1xxx)
  UNAUTHORIZED = 'E1001',
  FORBIDDEN = 'E1002',
  INVALID_TOKEN = 'E1003',
  TOKEN_EXPIRED = 'E1004',

  // Errores de validación (2xxx)
  VALIDATION_ERROR = 'E2001',
  INVALID_INPUT = 'E2002',
  MISSING_REQUIRED_FIELD = 'E2003',

  // Errores de base de datos (3xxx)
  DATABASE_ERROR = 'E3001',
  RECORD_NOT_FOUND = 'E3002',
  DUPLICATE_RECORD = 'E3003',
  CONNECTION_FAILED = 'E3004',

  // Errores de integraciones externas (4xxx)
  LLM_PROVIDER_ERROR = 'E4001',
  TELEGRAM_API_ERROR = 'E4002',
  GOOGLE_API_ERROR = 'E4003',
  FIREBASE_ERROR = 'E4004',

  // Errores de negocio (5xxx)
  BUSINESS_RULE_VIOLATION = 'E5001',
  QUOTA_EXCEEDED = 'E5002',
  OPERATION_NOT_ALLOWED = 'E5003',

  // Errores del sistema (6xxx)
  INTERNAL_ERROR = 'E6001',
  SERVICE_UNAVAILABLE = 'E6002',
  TIMEOUT = 'E6003',
}

export interface ErrorContext {
  [key: string]: unknown;
}

export class BaseError extends Error {
  public readonly code: ErrorCode;
  public readonly severity: ErrorSeverity;
  public readonly context: ErrorContext;
  public readonly timestamp: Date;
  public readonly originalError?: Error;

  constructor(
    message: string,
    code: ErrorCode = ErrorCode.INTERNAL_ERROR,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    context: ErrorContext = {},
    originalError?: Error
  ) {
    super(message);

    // Mantener el stack trace correcto
    Object.setPrototypeOf(this, new.target.prototype);

    this.name = this.constructor.name;
    this.code = code;
    this.severity = severity;
    this.context = context;
    this.timestamp = new Date();
    this.originalError = originalError;

    // Capturar el stack trace del error original si existe
    if (originalError?.stack) {
      this.stack = `${this.stack}\n\nCaused by:\n${originalError.stack}`;
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      severity: this.severity,
      context: this.context,
      timestamp: this.timestamp.toISOString(),
      ...(this.originalError && {
        originalError: {
          name: this.originalError.name,
          message: this.originalError.message,
        },
      }),
    };
  }

  isCritical(): boolean {
    return this.severity === ErrorSeverity.CRITICAL;
  }

  shouldRetry(): boolean {
    // Errores que potencialmente se pueden reintentar
    return [
      ErrorCode.TIMEOUT,
      ErrorCode.SERVICE_UNAVAILABLE,
      ErrorCode.CONNECTION_FAILED,
    ].includes(this.code);
  }
}
