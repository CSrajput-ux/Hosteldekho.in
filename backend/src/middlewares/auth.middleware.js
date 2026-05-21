// ─────────────────────────────────────────────────────────────
// Middleware — JWT Authentication
// Extracts and verifies Bearer token from Authorization header
// ─────────────────────────────────────────────────────────────

const { verifyAccessToken } = require('../utils/generateToken');
const ApiError = require('../utils/apiError');
const prisma = require('../config/database');

/**
 * Protect routes — requires valid JWT
 * Attaches req.user = { id, role, ... }
 */
const authenticate = async (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw ApiError.unauthorized('Access token is missing');
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true,
        mobile: true,
        role: true,
        isActive: true,
      },
    });

    if (!user) {
      throw ApiError.unauthorized('User associated with this token no longer exists');
    }

    if (!user.isActive) {
      throw ApiError.forbidden('Your account has been deactivated');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(ApiError.unauthorized('Invalid access token'));
    }
    if (error.name === 'TokenExpiredError') {
      return next(ApiError.unauthorized('Access token has expired'));
    }
    next(error);
  }
};

/**
 * Optional auth — attaches user if token present, but doesn't block
 */
const optionalAuth = async (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = verifyAccessToken(token);

      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, name: true, role: true, isActive: true },
      });

      if (user && user.isActive) {
        req.user = user;
      }
    }
  } catch {
    // Silently continue without user
  }

  next();
};

module.exports = { authenticate, optionalAuth };
