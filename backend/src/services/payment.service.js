// ─────────────────────────────────────────────────────────────
// Service — Payment (Razorpay)
// Order creation, verification, webhook, refund
// ─────────────────────────────────────────────────────────────

const crypto = require('crypto');
const prisma = require('../config/database');
const razorpay = require('../config/razorpay');
const ApiError = require('../utils/apiError');
const env = require('../config/env');
const { PAYMENT_STATUS } = require('../constants/paymentStatus');
const { BOOKING_STATUS } = require('../constants/bookingStatus');
const logger = require('../utils/logger');

class PaymentService {
  /**
   * Create a Razorpay order for a booking
   */
  async createOrder(bookingId, userId) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { payment: true },
    });

    if (!booking) throw ApiError.notFound('Booking not found');
    if (booking.userId !== userId) throw ApiError.forbidden('Not authorized');
    if (booking.status !== BOOKING_STATUS.PENDING_PAYMENT) {
      throw ApiError.badRequest('Booking is not in a payable state');
    }

    // Check if order already exists
    if (booking.payment && booking.payment.razorpayOrderId) {
      return {
        orderId: booking.payment.razorpayOrderId,
        amount: booking.payment.amount,
        currency: booking.payment.currency,
        bookingId: booking.id,
      };
    }

    // Create Razorpay order
    const amount = booking.totalPayable * 100; // in paise
    const order = await razorpay.orders.create({
      amount,
      currency: 'INR',
      receipt: `booking_${bookingId}`,
      notes: {
        bookingId,
        userId,
      },
    });

    // Save payment record
    await prisma.payment.create({
      data: {
        bookingId,
        razorpayOrderId: order.id,
        amount: booking.totalPayable,
        status: PAYMENT_STATUS.CREATED,
      },
    });

    return {
      orderId: order.id,
      amount: booking.totalPayable,
      currency: 'INR',
      bookingId: booking.id,
      keyId: env.RAZORPAY_KEY_ID,
    };
  }

  /**
   * Verify Razorpay payment signature
   */
  async verifyPayment({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) {
    const body = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      throw ApiError.badRequest('Payment verification failed — invalid signature');
    }

    // Update payment and booking status
    const payment = await prisma.payment.findFirst({
      where: { razorpayOrderId },
    });

    if (!payment) throw ApiError.notFound('Payment record not found');

    await prisma.$transaction([
      prisma.payment.update({
        where: { id: payment.id },
        data: {
          razorpayPaymentId,
          razorpaySignature,
          status: PAYMENT_STATUS.CAPTURED,
          paidAt: new Date(),
        },
      }),
      prisma.booking.update({
        where: { id: payment.bookingId },
        data: { status: BOOKING_STATUS.CONFIRMED },
      }),
    ]);

    return { message: 'Payment verified and booking confirmed', bookingId: payment.bookingId };
  }

  /**
   * Handle Razorpay webhook events
   */
  async handleWebhook(body, signature) {
    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
      .update(JSON.stringify(body))
      .digest('hex');

    if (expectedSignature !== signature) {
      throw ApiError.badRequest('Invalid webhook signature');
    }

    const event = body.event;
    const paymentEntity = body.payload?.payment?.entity;

    if (!paymentEntity) return { message: 'No payment entity in webhook' };

    switch (event) {
      case 'payment.captured': {
        await prisma.payment.updateMany({
          where: { razorpayOrderId: paymentEntity.order_id },
          data: {
            razorpayPaymentId: paymentEntity.id,
            status: PAYMENT_STATUS.CAPTURED,
            paidAt: new Date(),
          },
        });

        // Also confirm the booking
        const payment = await prisma.payment.findFirst({
          where: { razorpayOrderId: paymentEntity.order_id },
        });
        if (payment) {
          await prisma.booking.update({
            where: { id: payment.bookingId },
            data: { status: BOOKING_STATUS.CONFIRMED },
          });
        }
        break;
      }

      case 'payment.failed': {
        await prisma.payment.updateMany({
          where: { razorpayOrderId: paymentEntity.order_id },
          data: { status: PAYMENT_STATUS.FAILED },
        });
        break;
      }

      default:
        logger.info(`Unhandled Razorpay webhook event: ${event}`);
    }

    return { message: 'Webhook processed' };
  }

  /**
   * Get payment details for a booking
   */
  async getByBookingId(bookingId, userId) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { payment: true },
    });

    if (!booking) throw ApiError.notFound('Booking not found');
    if (booking.userId !== userId) throw ApiError.forbidden('Not authorized');

    return booking.payment;
  }

  /**
   * Process refund
   */
  async refund(bookingId, amount, userId) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { payment: true },
    });

    if (!booking) throw ApiError.notFound('Booking not found');
    if (booking.userId !== userId) throw ApiError.forbidden('Not authorized');

    if (!booking.payment || booking.payment.status !== PAYMENT_STATUS.CAPTURED) {
      throw ApiError.badRequest('No captured payment found for refund');
    }

    const refundAmount = amount || booking.payment.amount;

    const refund = await razorpay.payments.refund(booking.payment.razorpayPaymentId, {
      amount: refundAmount * 100, // paise
      notes: { bookingId },
    });

    await prisma.payment.update({
      where: { id: booking.payment.id },
      data: {
        status: PAYMENT_STATUS.REFUNDED,
        refundId: refund.id,
        refundAmount,
      },
    });

    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: BOOKING_STATUS.CANCELLED },
    });

    return { message: 'Refund initiated', refundId: refund.id, amount: refundAmount };
  }
}

module.exports = new PaymentService();
