// ─────────────────────────────────────────────────────────────
// Routes — Payment
// ─────────────────────────────────────────────────────────────

const { Router } = require('express');
const paymentController = require('../controllers/payment.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { createOrderSchema, verifyPaymentSchema, refundSchema } = require('../validators/payment.validator');

const router = Router();

// Webhook must be BEFORE auth middleware (Razorpay calls this)
router.post('/webhook/razorpay', paymentController.handleWebhook);

// Authenticated routes
router.use(authenticate);

router.post('/create-order', validate(createOrderSchema), paymentController.createOrder);
router.post('/verify', validate(verifyPaymentSchema), paymentController.verifyPayment);
router.get('/:bookingId', paymentController.getByBookingId);
router.post('/refund', validate(refundSchema), paymentController.refund);

module.exports = router;
