// ─────────────────────────────────────────────────────────────
// Middleware — Joi Validation
// Generic middleware that validates req.body / req.query / req.params
// ─────────────────────────────────────────────────────────────

const ApiError = require('../utils/apiError');

/**
 * Validate request data against a Joi schema
 *
 * @param {import('joi').ObjectSchema} schema - Joi schema
 * @param {'body'|'query'|'params'} source   - Where to read data from
 * @returns {Function} Express middleware
 *
 * @example
 * router.post('/signup', validate(signupSchema, 'body'), controller);
 */
const validate = (schema, source = 'body') => {
  return (req, _res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message.replace(/"/g, ''),
      }));

      return next(ApiError.badRequest('Validation failed', errors));
    }

    // Replace raw input with validated & sanitized data
    req[source] = value;
    next();
  };
};

module.exports = { validate };
