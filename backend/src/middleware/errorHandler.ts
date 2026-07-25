import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { config } from '../config/index.js';

export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const message = err.message || 'Internal Server Error';

  logger.error(`[ErrorHandler] ${req.method} ${req.originalUrl} - Status: ${statusCode} - Message: ${message}`, {
    stack: err.stack,
  });

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      statusCode,
      ...(config.isDev && { stack: err.stack }),
    },
  });
}
