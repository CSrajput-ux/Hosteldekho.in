// ─────────────────────────────────────────────────────────────
// Middleware — Rate Limiting
// Protects OTP, login, and general APIs from abuse
// ─────────────────────────────────────────────────────────────

const rateLimit = require('express-rate-limit');
const { sendError } = require('../utils/apiResponse');
const env = require('../config/env');

/**
 * General API rate limiter — Relaxed in dev, 100 per 15 min in prod
 */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.isDevelopment ? 2000 : 100, // Significantly increased for local testing
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    sendError(res, 429, 'Too many requests. Please try again after 15 minutes.');
  },
});

/**
 * Auth rate limiter — 10 attempts per 15 min per IP
 * Protects login and signup
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.isDevelopment ? 100 : 10, // Increased for dev testing
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    sendError(res, 429, 'Too many authentication attempts. Try again in 15 minutes.');
  },
});

/**
 * OTP rate limiter — 5 OTP requests per 10 min per IP
 */
const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: env.isDevelopment ? 50 : 5, // Increased for dev testing
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    sendError(res, 429, 'OTP request limit reached. Try again in 10 minutes.');
  },
});

module.exports = { generalLimiter, authLimiter, otpLimiter };
