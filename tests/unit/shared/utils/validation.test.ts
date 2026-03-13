/**
 * Tests para utilidades de validación
 */

import { describe, it, expect } from 'vitest';
import { isValidEmail, isValidPhone, isValidUrl } from '../../../../src/shared/utils/validation.ts';

describe('isValidEmail', () => {
  it('should return true for valid emails', () => {
    expect(isValidEmail('test@example.com')).toBe(true);
    expect(isValidEmail('user.name@example.co.uk')).toBe(true);
    expect(isValidEmail('user+tag@example.com')).toBe(true);
  });

  it('should return false for invalid emails', () => {
    expect(isValidEmail('invalid')).toBe(false);
    expect(isValidEmail('test@')).toBe(false);
    expect(isValidEmail('@example.com')).toBe(false);
    expect(isValidEmail('')).toBe(false);
  });
});

describe('isValidPhone', () => {
  it('should return true for valid phone numbers', () => {
    expect(isValidPhone('+1234567890')).toBe(true);
    expect(isValidPhone('+34 612 345 678')).toBe(true);
    expect(isValidPhone('+1 (555) 123-4567')).toBe(true);
    // Also accepts numbers without + (10+ digits)
    expect(isValidPhone('1234567890')).toBe(true);
  });

  it('should return false for invalid phone numbers', () => {
    expect(isValidPhone('123')).toBe(false); // Too short
    expect(isValidPhone('abc')).toBe(false);
    expect(isValidPhone('')).toBe(false);
  });
});

describe('isValidUrl', () => {
  it('should return true for valid URLs', () => {
    expect(isValidUrl('https://example.com')).toBe(true);
    expect(isValidUrl('http://example.com')).toBe(true);
    expect(isValidUrl('https://example.com/path')).toBe(true);
    expect(isValidUrl('https://example.com?query=value')).toBe(true);
    expect(isValidUrl('https://example.com#fragment')).toBe(true);
    // Also accepts ftp:// and other protocols
    expect(isValidUrl('ftp://example.com')).toBe(true);
  });

  it('should return false for invalid URLs', () => {
    expect(isValidUrl('example.com')).toBe(false); // Missing protocol
    expect(isValidUrl('')).toBe(false);
    expect(isValidUrl('not a url')).toBe(false);
  });
});
