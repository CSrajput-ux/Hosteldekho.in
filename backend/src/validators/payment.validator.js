// ─────────────────────────────────────────────────────────────
// Validator — Payment Schemas
// ─────────────────────────────────────────────────────────────

const Joi = require('joi');

const createOrderSchema = Joi.object({
  bookingId: Joi.string().required(),
});

const verifyPaymentSchema = Joi.object({
  razorpayOrderId: Joi.string().required(),
  razorpayPaymentId: Joi.string().required(),
  razorpaySignature: Joi.string().required(),
});

const refundSchema = Joi.object({
  bookingId: Joi.string().required(),
  amount: Joi.number().integer().min(1).optional(),
  reason: Joi.string().trim().max(500).optional(),
});

module.exports = {
  createOrderSchema,
  verifyPaymentSchema,
  refundSchema,
};
