// ─────────────────────────────────────────────────────────────
// Tests — Booking Module
// ─────────────────────────────────────────────────────────────

const request = require('supertest');
const app = require('../src/app');

describe('Booking API', () => {
  describe('POST /api/bookings', () => {
    it('should reject unauthenticated booking', async () => {
      const res = await request(app)
        .post('/api/bookings')
        .send({
          propertyId: 'test',
          roomId: 'test',
          moveInDate: '2026-05-01',
          durationMonths: 6,
        });

      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /api/bookings/my-bookings', () => {
    it('should reject unauthenticated request', async () => {
      const res = await request(app).get('/api/bookings/my-bookings');
      expect(res.statusCode).toBe(401);
    });
  });

  describe('PATCH /api/bookings/:id/cancel', () => {
    it('should reject unauthenticated cancellation', async () => {
      const res = await request(app)
        .patch('/api/bookings/fake-id/cancel')
        .send({ cancelReason: 'Changed plans' });

      expect(res.statusCode).toBe(401);
    });
  });
});
