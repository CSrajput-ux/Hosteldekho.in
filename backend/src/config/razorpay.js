// ─────────────────────────────────────────────────────────────
// Config — Razorpay SDK
// ─────────────────────────────────────────────────────────────

const Razorpay = require('razorpay');
const env = require('./env');

const razorpay = new Razorpay({
  key_id: env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
  key_secret: env.RAZORPAY_KEY_SECRET || 'placeholder_secret',
});

module.exports = razorpay;
