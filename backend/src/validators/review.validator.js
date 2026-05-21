// ─────────────────────────────────────────────────────────────
// Validator — Review Schemas
// ─────────────────────────────────────────────────────────────

const Joi = require('joi');

const createReviewSchema = Joi.object({
  propertyId: Joi.string().required(),
  bookingId: Joi.string().optional(),
  rating: Joi.number().integer().min(1).max(5).required()
    .messages({
      'number.min': 'Rating must be at least 1',
      'number.max': 'Rating cannot exceed 5',
    }),
  comment: Joi.string().trim().min(10).max(1000).required()
    .messages({ 'string.min': 'Review must be at least 10 characters' }),
});

const updateReviewSchema = Joi.object({
  rating: Joi.number().integer().min(1).max(5).optional(),
  comment: Joi.string().trim().min(10).max(1000).optional(),
});

module.exports = {
  createReviewSchema,
  updateReviewSchema,
};
