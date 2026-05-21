// ─────────────────────────────────────────────────────────────
// Validator — Booking Schemas
// ─────────────────────────────────────────────────────────────

const Joi = require('joi');

const createBookingSchema = Joi.object({
  propertyId: Joi.string().required(),
  roomId: Joi.string().required(),
  moveInDate: Joi.date().iso().min('now').required()
    .messages({ 'date.min': 'Move-in date must be in the future' }),
  durationMonths: Joi.number().integer().min(1).max(24).required()
    .messages({
      'number.min': 'Minimum stay is 1 month',
      'number.max': 'Maximum stay is 24 months',
    }),
});

const cancelBookingSchema = Joi.object({
  cancelReason: Joi.string().trim().max(500).optional(),
});

module.exports = {
  createBookingSchema,
  cancelBookingSchema,
};
