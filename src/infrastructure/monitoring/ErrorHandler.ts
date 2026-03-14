/**
 * ErrorHandler - Manejo centralizado de errores
 */

import { BaseError } from '../../shared/errors/index.js';
import { Logger, LogLevel } from './Logger.js';
import { formatErrorForTelegram, detectCommonError, createErrorResponse } from './UserFriendlyErrorMessages.js';

export interface HandledError {
  userMessage: string;
  logMessage: string;
  logLevel: 'info' | 'warn' | 'error';
  shouldLog: boolean;
  context?: Record<string, unknown>;
}

export class ErrorHandler {
  constructor(private logger: Logger) {}

  /**
   * Maneja un error y retorna un resultado amigable para el usuario
   */
  handleForUser(error: unknown, context?: Record<string, unknown>): HandledError {
    if (error instanceof BaseError) {
      const detectedCode = detectCommonError(error) || error.code;
      const userMessage = formatErrorForTelegram(error);

      const logLevel = this.getLogLevelFromSeverity(error.severity);
      const shouldLog = this.shouldLogError(error.code);

      if (shouldLog) {
        this.logger.log(logLevel, error.message, { ...context, code: error.code });
      }

      return {
        userMessage,
        logMessage: error.message,
        logLevel,
        shouldLog,
        context: { ...context, code: error.code },
      };
    }

    if (error instanceof Error) {
      const detectedCode = detectCommonError(error);
      const userMessage = formatErrorForTelegram(error);
      const shouldLog = detectedCode === null;

      if (shouldLog) {
        this.logger.error('Unhandled error', error, context);
      }

      return {
        userMessage,
        logMessage: error.message,
        logLevel: 'error',
        shouldLog,
        context,
      };
    }

    const errorStr = String(error);
    const userMessage = formatErrorForTelegram(errorStr);

    this.logger.error('Unknown error', undefined, {
      ...context,
      error,
    });

    return {
      userMessage,
      logMessage: errorStr,
      logLevel: 'error',
      shouldLog: true,
      context: { ...context, error },
    };
  }

  /**
   * Maneja un error y lo relanza (para uso interno)
   */
  handle(error: unknown, context?: Record<string, unknown>): never {
    if (error instanceof BaseError) {
      this.logger.error(error.message, error, { ...context, code: error.code });

      if (error.isCritical()) {
        this.logger.fatal('Critical error occurred', error, context);
        throw error;
      }

      throw error;
    }

    if (error instanceof Error) {
      this.logger.error('Unhandled error', error, context);
      throw error;
    }

    this.logger.error('Unknown error', undefined, {
      ...context,
      error,
    });

    throw new Error(String(error));
  }

  /**
   * Maneja errores asíncronos
   */
  async handleAsync<T>(
    fn: () => Promise<T>,
    context?: Record<string, unknown>
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      this.handle(error, context);
    }
  }

  /**
   * Envuelve una función para manejar errores automáticamente
   */
  wrap<T extends (...args: unknown[]) => Promise<unknown>>(
    fn: T,
    context?: Record<string, unknown>
  ): T {
    return (async (...args: unknown[]) => {
      try {
        return await fn(...args) as Promise<ReturnType<T>>;
      } catch (error) {
        this.handle(error, { ...context, args });
      }
    }) as T;
  }

  /**
   * Determina si un error debe ser loggeado basado en su código
   */
  private shouldLogError(errorCode: string): boolean {
    // No loggear errores comunes que ya están manejados
    const commonErrors = [
      'GROQ_RATE_LIMIT',
      'GOOGLE_AUTH_EXPIRED',
      'TELEGRAM_FILE_TOO_LARGE',
    ];
    return !commonErrors.includes(errorCode);
  }

  /**
   * Convierte severidad de error a nivel de log
   */
  private getLogLevelFromSeverity(severity: string): 'info' | 'warn' | 'error' {
    switch (severity) {
      case 'low':
        return 'info';
      case 'medium':
        return 'warn';
      case 'high':
      case 'critical':
        return 'error';
      default:
        return 'error';
    }
  }
}

export const errorHandler = new ErrorHandler(new Logger('app', LogLevel.INFO));
