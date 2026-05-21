// ─────────────────────────────────────────────────────────────
// Middleware — Role-based Access Control
// ─────────────────────────────────────────────────────────────

const ApiError = require('../utils/apiError');

/**
 * Restrict access to specified roles
 * Must be used AFTER authenticate middleware
 *
 * @param  {...string} allowedRoles - e.g. 'ADMIN', 'OWNER'
 * @returns {Function} Express middleware
 *
 * @example
 * router.get('/admin/users', authenticate, authorize('ADMIN'), controller);
 */
const authorize = (...allowedRoles) => {
  return (req, _res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        ApiError.forbidden(
          `Role '${req.user.role}' is not authorized to access this resource`
        )
      );
    }

    next();
  };
};

module.exports = { authorize };
