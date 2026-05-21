// ─────────────────────────────────────────────────────────────
// Middleware — Global Error Handler
// Catches all errors and returns consistent JSON responses
// ─────────────────────────────────────────────────────────────

const ApiError = require('../utils/apiError');
const logger = require('../utils/logger');
const env = require('../config/env');

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, _req, res, _next) => {
  let error = err;

  // Wrap non-ApiError errors
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal server error';
    error = new ApiError(statusCode, message, [], err.stack);
  }

  const response = {
    success: false,
    message: error.message,
    ...(error.errors && error.errors.length > 0 && { errors: error.errors }),
    ...(env.isDevelopment && { stack: error.stack }),
  };

  // Log server errors
  if (error.statusCode >= 500) {
    logger.error(`${error.statusCode} — ${error.message}`, { stack: error.stack });
  } else {
    logger.warn(`${error.statusCode} — ${error.message}`);
  }

  res.status(error.statusCode).json(response);
};

/**
 * 404 handler — must be mounted after all routes
 */
const notFoundHandler = (req, _res, next) => {
  next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} not found`));
};

module.exports = { errorHandler, notFoundHandler };
