// ─────────────────────────────────────────────────────────────
// Job — Payment Status Check
// Expires pending bookings that haven't been paid
// ─────────────────────────────────────────────────────────────

const cron = require('node-cron');
const prisma = require('../config/database');
const logger = require('../utils/logger');

/**
 * Runs every hour — expires bookings that have been
 * PENDING_PAYMENT for more than 30 minutes
 */
const paymentStatusJob = () => {
  cron.schedule('0 * * * *', async () => {
    try {
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

      const expired = await prisma.booking.findMany({
        where: {
          status: 'PENDING_PAYMENT',
          createdAt: { lt: thirtyMinutesAgo },
        },
      });

      for (const booking of expired) {
        await prisma.$transaction([
          prisma.booking.update({
            where: { id: booking.id },
            data: { status: 'EXPIRED' },
          }),
          prisma.room.update({
            where: { id: booking.roomId },
            data: { availableBeds: { increment: 1 } },
          }),
        ]);
      }

      if (expired.length > 0) {
        logger.info(`⏰ Expired ${expired.length} unpaid bookings`);
      }
    } catch (error) {
      logger.error('Payment status job failed:', error);
    }
  });

  logger.info('⏰ Payment status job scheduled (hourly)');
};

module.exports = paymentStatusJob;
