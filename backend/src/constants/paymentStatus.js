// ─────────────────────────────────────────────────────────────
// Constants — Payment Statuses
// ─────────────────────────────────────────────────────────────

const PAYMENT_STATUS = Object.freeze({
  CREATED: 'CREATED',
  AUTHORIZED: 'AUTHORIZED',
  CAPTURED: 'CAPTURED',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
});

module.exports = { PAYMENT_STATUS };
