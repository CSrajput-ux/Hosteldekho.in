// ─────────────────────────────────────────────────────────────
// Job — OTP Cleanup
// Removes expired and verified OTPs from the database
// ─────────────────────────────────────────────────────────────

const cron = require('node-cron');
const otpService = require('../services/otp.service');
const logger = require('../utils/logger');

/**
 * Runs every 6 hours — cleans up expired OTP records
 */
const cleanupOtpJob = () => {
  cron.schedule('0 */6 * * *', async () => {
    try {
      const cleaned = await otpService.cleanupExpiredOtps();
      logger.info(`🧹 Cleaned ${cleaned} expired OTPs`);
    } catch (error) {
      logger.error('OTP cleanup job failed:', error);
    }
  });

  logger.info('🧹 OTP cleanup job scheduled (every 6 hours)');
};

module.exports = cleanupOtpJob;
