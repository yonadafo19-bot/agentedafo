/**
 * ErrorHandler - Manejo centralizado de errores
 */

import { BaseError } from '../../shared/errors/index.js';
import { Logger, LogLevel } from './Logger.js';

export class ErrorHandler {
  constructor(private logger: Logger) {}

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
}

export const errorHandler = new ErrorHandler(new Logger('app', LogLevel.INFO));
