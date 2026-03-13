/**
 * Logger estructurado con Pino
 */

export enum LogLevel {
  TRACE = 0,
  DEBUG = 1,
  INFO = 2,
  WARN = 3,
  ERROR = 4,
  FATAL = 5,
}

export interface LogContext {
  userId?: string;
  requestId?: string;
  [key: string]: unknown;
}

export class Logger {
  constructor(
    private name: string,
    private minLevel: LogLevel = LogLevel.INFO
  ) {}

  private shouldLog(level: LogLevel): boolean {
    return level >= this.minLevel;
  }

  private format(level: string, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level}] [${this.name}]${contextStr} ${message}`;
  }

  trace(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.TRACE)) {
      console.log(this.format('TRACE', message, context));
    }
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.debug(this.format('DEBUG', message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.info(this.format('INFO', message, context));
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.format('WARN', message, context));
    }
  }

  error(message: string, error?: Error, context?: LogContext): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      const errorContext = error ? {
        ...context,
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
      } : context;
      console.error(this.format('ERROR', message, errorContext));
    }
  }

  fatal(message: string, error?: Error, context?: LogContext): void {
    if (this.shouldLog(LogLevel.FATAL)) {
      const errorContext = error ? {
        ...context,
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
      } : context;
      console.error(this.format('FATAL', message, errorContext));
    }
  }

  child(context: LogContext): Logger {
    const child = new Logger(this.name, this.minLevel);
    // child.logger = this.logger.child(context);
    return child;
  }
}

// Singleton instances
export const loggers = {
  app: new Logger('app'),
  agent: new Logger('agent'),
  telegram: new Logger('telegram'),
  llm: new Logger('llm'),
  database: new Logger('database'),
  tools: new Logger('tools'),
};
