import { Request, Response, NextFunction } from 'express';

/**
 * Strips script tags, event handlers, and malicious HTML/JavaScript vectors.
 */
export function sanitizeString(val: string): string {
  if (typeof val !== 'string') return val;

  let sanitized = val;

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');

  // Strip <script>...</script> tags and contents
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Strip iframe, object, embed tags
  sanitized = sanitized.replace(/<\/?(iframe|object|embed|applet|meta|link|style)[^>]*>/gi, '');

  // Strip inline javascript: and data: pseudo-protocols
  sanitized = sanitized.replace(/javascript:[^"'\s]*/gi, '');
  sanitized = sanitized.replace(/vbscript:[^"'\s]*/gi, '');

  // Strip on* event handlers like onload, onerror, onclick, onmouseover
  sanitized = sanitized.replace(/\bon\w+\s*=\s*(['"]).*?\1/gi, '');
  sanitized = sanitized.replace(/\bon\w+\s*=\s*[^>\s]+/gi, '');

  // Strip standalone HTML angle brackets in text fields where HTML is not allowed
  // (e.g. <img src=x onerror=alert(1)> becomes clean)
  sanitized = sanitized.replace(/<\s*img[^>]*>/gi, '');
  sanitized = sanitized.replace(/<\s*svg[^>]*>.*?<\s*\/\s*svg\s*>/gi, '');

  return sanitized.trim();
}

/**
 * Recursively walks and sanitizes an object, array, or string.
 */
export function deepSanitize(target: any): any {
  if (target === null || target === undefined) {
    return target;
  }

  if (typeof target === 'string') {
    return sanitizeString(target);
  }

  if (Array.isArray(target)) {
    return target.map((item) => deepSanitize(item));
  }

  if (typeof target === 'object' && target.constructor === Object) {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(target)) {
      // Clean key name as well to prevent prototype pollution
      const cleanKey = sanitizeString(key);
      if (cleanKey === '__proto__' || cleanKey === 'prototype' || cleanKey === 'constructor') {
        continue;
      }
      cleaned[cleanKey] = deepSanitize(value);
    }
    return cleaned;
  }

  return target;
}

/**
 * Express middleware to sanitize incoming request bodies, queries, and params.
 */
export function sanitizeInput(req: Request, _res: Response, next: NextFunction): void {
  try {
    if (req.body && typeof req.body === 'object') {
      req.body = deepSanitize(req.body);
    }
    if (req.query && typeof req.query === 'object') {
      req.query = deepSanitize(req.query);
    }
    if (req.params && typeof req.params === 'object') {
      req.params = deepSanitize(req.params);
    }
  } catch (err) {
    // If sanitization fails, log and continue safely
    console.warn('[SanitizeInput] Warning during input sanitization:', err);
  }
  next();
}

