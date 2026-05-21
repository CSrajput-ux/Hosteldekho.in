// ─────────────────────────────────────────────────────────────
// Controller — Authentication
// ─────────────────────────────────────────────────────────────

const authService = require('../services/auth.service');
const otpService = require('../services/otp.service');
const { sendSuccess } = require('../utils/apiResponse');

class AuthController {
  async signup(req, res, next) {
    try {
      const result = await authService.signup(req.body);
      sendSuccess(res, 201, 'Account created successfully', result);
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const result = await authService.loginWithPassword(req.body);
      sendSuccess(res, 200, 'Login successful', result);
    } catch (error) {
      next(error);
    }
  }

  async sendOtp(req, res, next) {
    try {
      const result = await otpService.sendOtp(req.body.mobile);
      sendSuccess(res, 200, 'OTP sent', result);
    } catch (error) {
      next(error);
    }
  }

  async verifyOtp(req, res, next) {
    try {
      const { mobile, code } = req.body;
      await otpService.verifyOtp(mobile, code);
      const result = await authService.loginWithOtp(mobile);
      sendSuccess(res, 200, 'OTP verified and logged in', result);
    } catch (error) {
      next(error);
    }
  }

  async googleAuth(req, res, next) {
    try {
      const { idToken } = req.body;
      const result = await authService.googleLogin({ idToken });
      sendSuccess(res, 200, 'Google login successful', result);
    } catch (error) {
      next(error);
    }
  }

  async logout(_req, res, next) {
    try {
      // In a stateless JWT setup, logout is handled client-side
      // For enhanced security, add token to a blocklist (Redis)
      sendSuccess(res, 200, 'Logged out successfully');
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;
      const result = await authService.refreshAccessToken(refreshToken);
      sendSuccess(res, 200, 'Token refreshed', result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
