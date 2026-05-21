// ─────────────────────────────────────────────────────────────
// Job — KYC Review Reminder
// Notifies admins about pending KYC reviews
// ─────────────────────────────────────────────────────────────

const cron = require('node-cron');
const prisma = require('../config/database');
const logger = require('../utils/logger');

/**
 * Runs daily at 10 AM — checks for pending KYC reviews
 */
const kycReviewJob = () => {
  cron.schedule('0 10 * * *', async () => {
    try {
      const pendingCount = await prisma.kyc.count({
        where: { status: { in: ['PENDING', 'UNDER_REVIEW'] } },
      });

      if (pendingCount > 0) {
        logger.info(`📋 ${pendingCount} KYC review(s) pending admin action`);
        // TODO: Send email/notification to admin
      }
    } catch (error) {
      logger.error('KYC review job failed:', error);
    }
  });

  logger.info('📋 KYC review job scheduled (daily at 10 AM)');
};

module.exports = kycReviewJob;
