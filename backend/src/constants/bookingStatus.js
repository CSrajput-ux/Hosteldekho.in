// ─────────────────────────────────────────────────────────────
// Constants — Booking Statuses
// ─────────────────────────────────────────────────────────────

const BOOKING_STATUS = Object.freeze({
  PENDING_PAYMENT: 'PENDING_PAYMENT',
  CONFIRMED: 'CONFIRMED',
  CANCELLED: 'CANCELLED',
  EXPIRED: 'EXPIRED',
  CHECKED_IN: 'CHECKED_IN',
  COMPLETED: 'COMPLETED',
});

const CANCELLABLE_STATUSES = [
  BOOKING_STATUS.PENDING_PAYMENT,
  BOOKING_STATUS.CONFIRMED,
];

module.exports = { BOOKING_STATUS, CANCELLABLE_STATUSES };
