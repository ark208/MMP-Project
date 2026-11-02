import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError, sendError } from '../utils/response';

export function errorHandler(
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Handle custom AppError
  if (err instanceof AppError) {
    sendError(res, err.statusCode, err.code, err.message, err.details);
    return;
  }

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const details = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    sendError(res, 400, 'VALIDATION_ERROR', 'Input validation failed', details);
    return;
  }

  // Handle Multer upload errors
  if (err.name === 'MulterError') {
    sendError(res, 400, 'UPLOAD_ERROR', err.message);
    return;
  }

  // Handle JSON parse errors
  if (err instanceof SyntaxError && 'status' in err && (err as any).status === 400) {
    sendError(res, 400, 'BAD_REQUEST', 'Malformed JSON in request body');
    return;
  }

  console.error('[Unhandled Server Error]', err);
  sendError(
    res,
    500,
    'INTERNAL_SERVER_ERROR',
    process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred on the server'
      : err.message || 'Internal server error'
  );
}

