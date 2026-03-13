/**
 * Tests para BaseError
 */

import { describe, it, expect } from 'vitest';
import {
  BaseError,
  UnauthorizedError,
  ForbiddenError,
  ValidationError,
  RecordNotFoundError,
  LLMProviderError,
  BusinessRuleViolationError,
  QuotaExceededError,
  ErrorCode,
  ErrorSeverity,
} from '../../../../src/shared/errors/index.ts';

describe('BaseError', () => {
  it('should create a base error with code and severity', () => {
    const error = new BaseError('Test message', ErrorCode.INTERNAL_ERROR, ErrorSeverity.MEDIUM);
    expect(error.message).toBe('Test message');
    expect(error.code).toBe('E6001');
    expect(error.severity).toBe('medium');
    expect(error.name).toBe('BaseError');
  });

  it('should include context in error', () => {
    const context = { userId: '123', action: 'test' };
    const error = new BaseError('Test message', ErrorCode.INTERNAL_ERROR, ErrorSeverity.MEDIUM, context);
    expect(error.context).toEqual(context);
  });

  it('should serialize to JSON correctly', () => {
    const error = new BaseError('Test message', ErrorCode.INTERNAL_ERROR, ErrorSeverity.MEDIUM, { key: 'value' });
    const json = error.toJSON();
    expect(json).toMatchObject({
      name: 'BaseError',
      message: 'Test message',
      code: 'E6001',
      severity: 'medium',
      context: { key: 'value' },
    });
  });
});

describe('AuthenticationError', () => {
  it('should create UnauthorizedError with correct defaults', () => {
    const error = new UnauthorizedError('No autorizado');
    expect(error.code).toBe('E1001');
    expect(error.severity).toBe('high');
  });

  it('should create ForbiddenError with correct defaults', () => {
    const error = new ForbiddenError('Prohibido');
    expect(error.code).toBe('E1002');
    expect(error.severity).toBe('high');
  });
});

describe('ValidationError', () => {
  it('should include field details', () => {
    const details = [
      { field: 'email', message: 'Invalid email' },
      { field: 'password', message: 'Too short' }
    ];
    const error = new ValidationError('Validation failed', details);
    expect(error.details).toEqual(details);
    expect(error.code).toBe('E2001');
  });

  it('should create forField static method', () => {
    const error = ValidationError.forField('email', 'Invalid email', 'test@test');
    expect(error.details).toHaveLength(1);
    expect(error.details[0]).toMatchObject({
      field: 'email',
      message: 'Invalid email',
      value: 'test@test'
    });
  });
});

describe('DatabaseError', () => {
  it('should create RecordNotFoundError with correct defaults', () => {
    const error = new RecordNotFoundError('User', '123');
    expect(error.code).toBe('E3002');
    expect(error.context?.entity).toBe('User');
    expect(error.context?.identifier).toBe('123');
  });
});

describe('IntegrationError', () => {
  it('should create LLMProviderError with correct defaults', () => {
    const error = new LLMProviderError('groq', 'Rate limit exceeded');
    expect(error.code).toBe('E4001');
    expect(error.severity).toBe('high');
    expect(error.context?.provider).toBe('groq');
  });
});

describe('BusinessError', () => {
  it('should create BusinessRuleViolationError with correct defaults', () => {
    const error = new BusinessRuleViolationError('max_attempts', 'Too many attempts');
    expect(error.code).toBe('E5001');
    expect(error.severity).toBe('medium');
    expect(error.message).toContain('max_attempts');
  });

  it('should create QuotaExceededError with correct defaults', () => {
    const error = new QuotaExceededError('api_calls', 101, 100);
    expect(error.code).toBe('E5002');
    expect(error.severity).toBe('medium');
    expect(error.context?.resource).toBe('api_calls');
  });
});
