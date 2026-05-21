// ─────────────────────────────────────────────────────────────
// Validator — Property Schemas
// ─────────────────────────────────────────────────────────────

const Joi = require('joi');

const createPropertySchema = Joi.object({
  title: Joi.string().trim().min(3).max(200).required(),
  description: Joi.string().trim().max(2000).optional(),
  type: Joi.string().valid(
    'BOYS_HOSTEL', 'GIRLS_HOSTEL', 'PG', 'FLAT', 'ROOM', 'COLIVING'
  ).required(),
  genderAllowed: Joi.string().valid('BOYS', 'GIRLS', 'UNISEX').required(),
  address: Joi.string().trim().min(5).max(500).required(),
  city: Joi.string().trim().min(2).max(100).required(),
  state: Joi.string().trim().min(2).max(100).required(),
  pincode: Joi.string().pattern(/^\d{6}$/).optional()
    .messages({ 'string.pattern.base': 'Pincode must be 6 digits' }),
  latitude: Joi.number().min(-90).max(90).optional(),
  longitude: Joi.number().min(-180).max(180).optional(),
  priceStartingFrom: Joi.number().integer().min(0).required()
    .messages({ 'any.required': 'Starting price is required' }),
  depositAmount: Joi.number().integer().min(0).required(),
  foodIncluded: Joi.boolean().default(false),
  electricityIncluded: Joi.boolean().default(false),
  wifiIncluded: Joi.boolean().default(false),
  acAvailable: Joi.boolean().default(false),
  laundryAvailable: Joi.boolean().default(false),
  parkingAvailable: Joi.boolean().default(false),
  cctvAvailable: Joi.boolean().default(false),
  powerBackup: Joi.boolean().default(false),
  rules: Joi.string().trim().max(2000).optional(),
});

const updatePropertySchema = createPropertySchema.fork(
  ['title', 'type', 'genderAllowed', 'address', 'city', 'state', 'priceStartingFrom', 'depositAmount'],
  (field) => field.optional()
);

const updatePropertyStatusSchema = Joi.object({
  status: Joi.string().valid('PENDING', 'ACTIVE', 'REJECTED', 'PAUSED', 'DELETED').required(),
});

const createRoomSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  sharingType: Joi.string().valid('SINGLE', 'DOUBLE_SHARING', 'TRIPLE_SHARING', 'FOUR_SHARING', 'DORM').required(),
  pricePerMonth: Joi.number().integer().min(0).required(),
  deposit: Joi.number().integer().min(0).required(),
  totalBeds: Joi.number().integer().min(1).required(),
  availableBeds: Joi.number().integer().min(0).required(),
  hasAc: Joi.boolean().default(false),
  hasAttachedBathroom: Joi.boolean().default(false),
  furnished: Joi.boolean().default(false),
});

const updateRoomSchema = createRoomSchema.fork(
  ['name', 'sharingType', 'pricePerMonth', 'deposit', 'totalBeds', 'availableBeds'],
  (field) => field.optional()
);

module.exports = {
  createPropertySchema,
  updatePropertySchema,
  updatePropertyStatusSchema,
  createRoomSchema,
  updateRoomSchema,
};
