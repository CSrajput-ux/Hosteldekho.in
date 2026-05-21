// ─────────────────────────────────────────────────────────────
// Constants — Property Statuses & Types
// ─────────────────────────────────────────────────────────────

const PROPERTY_STATUS = Object.freeze({
  PENDING: 'PENDING',
  ACTIVE: 'ACTIVE',
  REJECTED: 'REJECTED',
  PAUSED: 'PAUSED',
  DELETED: 'DELETED',
});

const PROPERTY_TYPE = Object.freeze({
  BOYS_HOSTEL: 'BOYS_HOSTEL',
  GIRLS_HOSTEL: 'GIRLS_HOSTEL',
  PG: 'PG',
  FLAT: 'FLAT',
  ROOM: 'ROOM',
  COLIVING: 'COLIVING',
});

const GENDER_ALLOWED = Object.freeze({
  BOYS: 'BOYS',
  GIRLS: 'GIRLS',
  UNISEX: 'UNISEX',
});

module.exports = { PROPERTY_STATUS, PROPERTY_TYPE, GENDER_ALLOWED };
