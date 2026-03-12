/**
 * IntegrationError - Errores de integraciones externas
 */

import { BaseError, ErrorCode, ErrorSeverity } from './BaseError.js';

export class LLMProviderError extends BaseError {
  constructor(
    provider: string,
    message: string,
    originalError?: Error,
    context = {}
  ) {
    super(
      `Error del proveedor LLM (${provider}): ${message}`,
      ErrorCode.LLM_PROVIDER_ERROR,
      ErrorSeverity.HIGH,
      { provider, ...context },
      originalError
    );
  }
}

export class TelegramAPIError extends BaseError {
  constructor(
    message: string,
    originalError?: Error,
    context = {}
  ) {
    super(
      `Error de API de Telegram: ${message}`,
      ErrorCode.TELEGRAM_API_ERROR,
      ErrorSeverity.HIGH,
      context,
      originalError
    );
  }
}

export class GoogleAPIError extends BaseError {
  constructor(
    service: string,
    message: string,
    originalError?: Error,
    context = {}
  ) {
    super(
      `Error de API de Google (${service}): ${message}`,
      ErrorCode.GOOGLE_API_ERROR,
      ErrorSeverity.HIGH,
      { service, ...context },
      originalError
    );
  }
}

export class FirebaseError extends BaseError {
  constructor(
    service: string,
    message: string,
    originalError?: Error,
    context = {}
  ) {
    super(
      `Error de Firebase (${service}): ${message}`,
      ErrorCode.FIREBASE_ERROR,
      ErrorSeverity.HIGH,
      { service, ...context },
      originalError
    );
  }
}
