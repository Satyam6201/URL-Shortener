import { logger } from '../utils/logger.js';
import { config } from '../config/env.js';

export function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);

  if (statusCode >= 500) {
    logger.error(`Server Error: ${err.message}`, { stack: err.stack, path: req.path });
  } else {
    logger.warn(`Client Error [${statusCode}]: ${err.message}`, { path: req.path });
  }

  res.status(statusCode).json({
    success: false,
    error: err.message || 'An unexpected internal error occurred',
    details: err.details || undefined,
    stack: config.env === 'development' ? err.stack : undefined,
  });
}
