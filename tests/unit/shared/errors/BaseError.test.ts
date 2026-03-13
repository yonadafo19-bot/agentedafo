/**
 * Tests de BaseError
 */

import { describe, it, expect } from 'vitest';
import { BaseError, ErrorCode, ErrorSeverity } from '../../../shared/errors/BaseError.js';

describe('BaseError', () => {
  it('should create error with basic info', () => {
    const error = new BaseError('Test error', ErrorCode.VALIDATION_ERROR, ErrorSeverity.MEDIUM);

    expect(error.message).toBe('Test error');
    expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
    expect(error.severity).toBe(ErrorSeverity.MEDIUM);
    expect(error.timestamp).toBeInstanceOf(Date);
  });

  it('should serialize to JSON correctly', () => {
    const error = new BaseError('Test error', ErrorCode.DATABASE_ERROR, ErrorSeverity.HIGH, { userId: '123' });
    const json = error.toJSON();

    expect(json.name).toBe('BaseError');
    expect(json.message).toBe('Test error');
    expect(json.context).toEqual({ userId: '123' });
  });

  it('should identify critical errors', () => {
    const criticalError = new BaseError('Critical', ErrorCode.INTERNAL_ERROR, ErrorSeverity.CRITICAL);
    const normalError = new BaseError('Normal', ErrorCode.VALIDATION_ERROR, ErrorSeverity.LOW);

    expect(criticalError.isCritical()).toBe(true);
    expect(normalError.isCritical()).toBe(false);
  });

  it('should identify retryable errors', () => {
    const timeoutError = new BaseError('Timeout', ErrorCode.TIMEOUT, ErrorSeverity.HIGH);
    const validationError = new BaseError('Invalid', ErrorCode.VALIDATION_ERROR, ErrorSeverity.LOW);

    expect(timeoutError.shouldRetry()).toBe(true);
    expect(validationError.shouldRetry()).toBe(false);
  });
});
