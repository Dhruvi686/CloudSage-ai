/**
 * CloudSight AI — Error Handling Middleware
 *
 * Centralized error handler that converts all errors into the
 * ErrorResponse format from API-Specification.yaml.
 */

import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/errors';
import { createLogger } from '../utils/logger';
import type { ErrorResponse } from '../types';

const logger = createLogger('error-handler');

/**
 * Express error-handling middleware.
 * Catches all thrown/next(err) errors and returns structured JSON.
 */
export function errorMiddleware(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const response: ErrorResponse = {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: { issues: err.errors },
      },
    };
    logger.warn('Validation error', { issues: err.errors });
    res.status(400).json(response);
    return;
  }

  // Handle custom AppError hierarchy
  if (err instanceof AppError) {
    const response: ErrorResponse = {
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    };
    logger.error(`${err.name}: ${err.message}`, { code: err.code, statusCode: err.statusCode });
    res.status(err.statusCode).json(response);
    return;
  }

  // Handle unexpected errors
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  const response: ErrorResponse = {
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
  };
  res.status(500).json(response);
}
