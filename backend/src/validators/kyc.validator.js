// ─────────────────────────────────────────────────────────────
// Validator — KYC Schemas
// ─────────────────────────────────────────────────────────────

const Joi = require('joi');

const submitAadhaarSchema = Joi.object({
  aadhaarNumber: Joi.string().pattern(/^\d{12}$/).required()
    .messages({ 'string.pattern.base': 'Aadhaar must be a 12-digit number' }),
});

const submitPanSchema = Joi.object({
  panNumber: Joi.string().pattern(/^[A-Z]{5}\d{4}[A-Z]$/).required()
    .messages({ 'string.pattern.base': 'Enter a valid PAN (e.g. ABCDE1234F)' }),
});

const kycActionSchema = Joi.object({
  status: Joi.string().valid('APPROVED', 'REJECTED').required(),
  rejectionReason: Joi.string().trim().max(500)
    .when('status', {
      is: 'REJECTED',
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
});

module.exports = {
  submitAadhaarSchema,
  submitPanSchema,
  kycActionSchema,
};
