// ─────────────────────────────────────────────────────────────
// Routes — Auth
// ─────────────────────────────────────────────────────────────

const { Router } = require('express');
const authController = require('../controllers/auth.controller');
const { validate } = require('../middlewares/validate.middleware');
const { authLimiter, otpLimiter } = require('../middlewares/rateLimit.middleware');
const { authenticate } = require('../middlewares/auth.middleware');
const {
  signupSchema, loginSchema, sendOtpSchema,
  verifyOtpSchema, refreshTokenSchema,
} = require('../validators/auth.validator');

const router = Router();

router.post('/signup', authLimiter, validate(signupSchema), authController.signup);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/send-otp', otpLimiter, validate(sendOtpSchema), authController.sendOtp);
router.post('/verify-otp', otpLimiter, validate(verifyOtpSchema), authController.verifyOtp);
router.post('/google', authLimiter, authController.googleAuth);
router.post('/logout', authenticate, authController.logout);
router.post('/refresh-token', validate(refreshTokenSchema), authController.refreshToken);

module.exports = router;
