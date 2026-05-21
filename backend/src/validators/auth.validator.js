// ─────────────────────────────────────────────────────────────
// Validator — Auth Schemas
// ─────────────────────────────────────────────────────────────

const Joi = require('joi');

const signupSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required()
    .messages({ 'any.required': 'Name is required' }),
  email: Joi.string().email().lowercase().trim().optional(),
  mobile: Joi.string().pattern(/^\+?\d{7,15}$/).required()
    .messages({
      'string.pattern.base': 'Enter a valid 10-digit Indian mobile number',
      'any.required': 'Mobile number is required',
    }),
  password: Joi.string().min(6).max(128).optional(),
  role: Joi.string().valid('USER', 'OWNER').default('USER'),
  gender: Joi.string().valid('male', 'female', 'other').optional(),
});

const loginSchema = Joi.object({
  mobile: Joi.string().pattern(/^[6-9]\d{9}$/).optional(),
  email: Joi.string().email().lowercase().optional(),
  password: Joi.string().min(6).optional(),
}).or('mobile', 'email')
  .messages({ 'object.missing': 'Either mobile or email is required' });

const sendOtpSchema = Joi.object({
  mobile: Joi.string().pattern(/^\+?\d{7,15}$/).required()
    .messages({
      'string.pattern.base': 'Enter a valid 10-digit Indian mobile number',
      'any.required': 'Mobile number is required',
    }),
});

const verifyOtpSchema = Joi.object({
  mobile: Joi.string().pattern(/^[6-9]\d{9}$/).required(),
  code: Joi.string().length(6).required()
    .messages({ 'string.length': 'OTP must be 6 digits' }),
});

const googleAuthSchema = Joi.object({
  idToken: Joi.string().required()
    .messages({ 'any.required': 'Google ID token is required' }),
});

const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required()
    .messages({ 'any.required': 'Refresh token is required' }),
});

module.exports = {
  signupSchema,
  loginSchema,
  sendOtpSchema,
  verifyOtpSchema,
  googleAuthSchema,
  refreshTokenSchema,
};
