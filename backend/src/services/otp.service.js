// ─────────────────────────────────────────────────────────────
// Service — OTP
// Generate, send, verify, and cleanup OTPs
// ─────────────────────────────────────────────────────────────

const crypto = require('crypto');
const prisma = require('../config/database');
const ApiError = require('../utils/apiError');
const logger = require('../utils/logger');

const OTP_EXPIRY_MINUTES = 5;

class OtpService {
  /**
   * Generate and "send" an OTP
   * In production: integrate Twilio / MSG91 / WhatsApp API
   * In development: logs OTP to console
   */
  async sendOtp(mobile) {
    // Generate 6-digit OTP
    const code = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    // Invalidate any existing OTPs for this mobile
    await prisma.otp.updateMany({
      where: { mobile, verified: false },
      data: { verified: true },
    });

    // Save new OTP
    await prisma.otp.create({
      data: { mobile, code, expiresAt },
    });

    // TODO: Send via Twilio / MSG91 in production
    logger.info(`📱 OTP for ${mobile}: ${code} (dev mode)`);

    return { 
      message: 'OTP sent successfully', 
      expiresIn: `${OTP_EXPIRY_MINUTES} minutes`,
      otp: process.env.NODE_ENV !== 'production' ? code : undefined // Show only in dev
    };
  }

  /**
   * Verify OTP
   */
  async verifyOtp(mobile, code) {
    const otp = await prisma.otp.findFirst({
      where: {
        mobile,
        code,
        verified: false,
        expiresAt: { gte: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp) {
      throw ApiError.badRequest('Invalid or expired OTP');
    }

    // Mark as verified
    await prisma.otp.update({
      where: { id: otp.id },
      data: { verified: true },
    });

    return { verified: true };
  }

  /**
   * Cleanup expired and verified OTPs (used by cron job)
   */
  async cleanupExpiredOtps() {
    const result = await prisma.otp.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { verified: true, createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
        ],
      },
    });

    logger.info(`🧹 Cleaned up ${result.count} expired OTPs`);
    return result.count;
  }
}

module.exports = new OtpService();
