// ─────────────────────────────────────────────────────────────
// Job — Booking Reminder
// Sends reminders for upcoming move-in dates
// ─────────────────────────────────────────────────────────────

const cron = require('node-cron');
const prisma = require('../config/database');
const notificationService = require('../services/notification.service');
const logger = require('../utils/logger');

/**
 * Runs daily at 9 AM — sends move-in reminders
 * for bookings happening in the next 3 days
 */
const bookingReminderJob = () => {
  cron.schedule('0 9 * * *', async () => {
    try {
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const upcomingBookings = await prisma.booking.findMany({
        where: {
          status: 'CONFIRMED',
          moveInDate: {
            gte: today,
            lte: threeDaysFromNow,
          },
        },
        include: {
          user: { select: { id: true, name: true } },
          property: { select: { title: true } },
        },
      });

      for (const booking of upcomingBookings) {
        const daysLeft = Math.ceil((booking.moveInDate - today) / (1000 * 60 * 60 * 24));

        await notificationService.sendBookingReminder(booking.userId, {
          propertyName: booking.property.title,
          daysLeft,
          moveInDate: booking.moveInDate.toLocaleDateString('en-IN'),
        });
      }

      logger.info(`📅 Sent ${upcomingBookings.length} booking reminders`);
    } catch (error) {
      logger.error('Booking reminder job failed:', error);
    }
  });

  logger.info('📅 Booking reminder job scheduled (daily at 9 AM)');
};

module.exports = bookingReminderJob;
