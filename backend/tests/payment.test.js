// ─────────────────────────────────────────────────────────────
// Tests — Payment Module
// ─────────────────────────────────────────────────────────────

const request = require('supertest');
const app = require('../src/app');

describe('Payment API', () => {
  describe('POST /api/payments/create-order', () => {
    it('should reject unauthenticated order creation', async () => {
      const res = await request(app)
        .post('/api/payments/create-order')
        .send({ bookingId: 'fake-id' });

      expect(res.statusCode).toBe(401);
    });
  });

  describe('POST /api/payments/verify', () => {
    it('should reject unauthenticated payment verification', async () => {
      const res = await request(app)
        .post('/api/payments/verify')
        .send({
          razorpayOrderId: 'order_123',
          razorpayPaymentId: 'pay_123',
          razorpaySignature: 'sig_123',
        });

      expect(res.statusCode).toBe(401);
    });
  });

  describe('POST /api/payments/webhook/razorpay', () => {
    it('should handle webhook without auth', async () => {
      const res = await request(app)
        .post('/api/payments/webhook/razorpay')
        .send({ event: 'payment.captured' });

      // Webhook is public but should require valid signature
      expect([200, 400]).toContain(res.statusCode);
    });
  });
});
