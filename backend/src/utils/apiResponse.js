// ─────────────────────────────────────────────────────────────
// Utils — Standardized API Response
// ─────────────────────────────────────────────────────────────

/**
 * Send a consistent success response
 * @param {import('express').Response} res
 * @param {number} statusCode
 * @param {string} message
 * @param {object|null} data
 * @param {object|null} meta - Pagination or extra metadata
 */
const sendSuccess = (res, statusCode = 200, message = 'Success', data = null, meta = null) => {
  const response = {
    success: true,
    message,
    data,
  };

  if (meta) {
    response.meta = meta;
  }

  return res.status(statusCode).json(response);
};

/**
 * Send a consistent error response
 * @param {import('express').Response} res
 * @param {number} statusCode
 * @param {string} message
 * @param {Array|null} errors
 */
const sendError = (res, statusCode = 500, message = 'Internal server error', errors = null) => {
  const response = {
    success: false,
    message,
  };

  if (errors) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};

module.exports = { sendSuccess, sendError };
