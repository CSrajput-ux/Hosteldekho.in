// ─────────────────────────────────────────────────────────────
// Controller — Payment
// ─────────────────────────────────────────────────────────────

const paymentService = require('../services/payment.service');
const { sendSuccess } = require('../utils/apiResponse');

class PaymentController {
  async createOrder(req, res, next) {
    try {
      const order = await paymentService.createOrder(req.body.bookingId, req.user.id);
      sendSuccess(res, 201, 'Payment order created', order);
    } catch (error) {
      next(error);
    }
  }

  async verifyPayment(req, res, next) {
    try {
      const result = await paymentService.verifyPayment(req.body);
      sendSuccess(res, 200, 'Payment verified', result);
    } catch (error) {
      next(error);
    }
  }

  async handleWebhook(req, res, next) {
    try {
      const signature = req.headers['x-razorpay-signature'];
      const result = await paymentService.handleWebhook(req.body, signature);
      sendSuccess(res, 200, 'Webhook processed', result);
    } catch (error) {
      next(error);
    }
  }

  async getByBookingId(req, res, next) {
    try {
      const payment = await paymentService.getByBookingId(req.params.bookingId, req.user.id);
      sendSuccess(res, 200, 'Payment details', payment);
    } catch (error) {
      next(error);
    }
  }

  async refund(req, res, next) {
    try {
      const result = await paymentService.refund(req.body.bookingId, req.body.amount, req.user.id);
      sendSuccess(res, 200, 'Refund initiated', result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PaymentController();
