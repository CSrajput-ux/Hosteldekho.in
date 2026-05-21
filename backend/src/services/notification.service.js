// ─────────────────────────────────────────────────────────────
// Service — Notification
// Push, SMS, and in-app notification management
// ─────────────────────────────────────────────────────────────

const prisma = require('../config/database');
const logger = require('../utils/logger');

class NotificationService {
  /**
   * Create and send an in-app notification
   */
  async send(userId, { title, body, type, data = null }) {
    const notification = await prisma.notification.create({
      data: { userId, title, body, type, data },
    });

    // TODO: Push via Firebase / Socket.IO in production
    logger.info(`🔔 Notification sent to ${userId}: ${title}`);

    return notification;
  }

  /**
   * Send booking confirmation notification
   */
  async sendBookingConfirmation(userId, bookingDetails) {
    return this.send(userId, {
      title: 'Booking Confirmed! 🎉',
      body: `Your booking at ${bookingDetails.propertyName} is confirmed. Move-in: ${bookingDetails.moveInDate}`,
      type: 'BOOKING_CONFIRMED',
      data: bookingDetails,
    });
  }

  /**
   * Send OTP notification (placeholder for SMS)
   */
  async sendOtpSms(mobile, otp) {
    // TODO: Integrate Twilio / MSG91 / WhatsApp API
    logger.info(`📱 SMS OTP to ${mobile}: ${otp} (dev mode — not actually sent)`);
    return { sent: true };
  }

  /**
   * Send booking reminder
   */
  async sendBookingReminder(userId, bookingDetails) {
    return this.send(userId, {
      title: 'Move-in Reminder 🏠',
      body: `Your move-in at ${bookingDetails.propertyName} is in ${bookingDetails.daysLeft} days.`,
      type: 'BOOKING_REMINDER',
      data: bookingDetails,
    });
  }

  /**
   * Get user's notifications
   */
  async getUserNotifications(userId, { skip, limit }) {
    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where: { userId } }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return { notifications, total, unreadCount };
  }

  /**
   * Mark notifications as read
   */
  async markAsRead(userId, notificationIds) {
    return prisma.notification.updateMany({
      where: {
        id: { in: notificationIds },
        userId,
      },
      data: { isRead: true },
    });
  }

  /**
   * Mark all as read
   */
  async markAllAsRead(userId) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }
}

module.exports = new NotificationService();
