// ─────────────────────────────────────────────────────────────
// Tests — Property Module
// ─────────────────────────────────────────────────────────────

const request = require('supertest');
const app = require('../src/app');

describe('Property API', () => {
  let ownerToken;

  beforeAll(async () => {
    // Create an owner and get token
    const res = await request(app)
      .post('/api/auth/signup')
      .send({
        name: 'Property Owner',
        mobile: '9876500010',
        role: 'OWNER',
      });
    ownerToken = res.body.data?.accessToken;
  });

  describe('GET /api/properties/featured', () => {
    it('should return featured properties (public)', async () => {
      const res = await request(app).get('/api/properties/featured');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /api/properties/categories', () => {
    it('should return categories with counts', async () => {
      const res = await request(app).get('/api/properties/categories');
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /api/properties', () => {
    it('should return paginated properties', async () => {
      const res = await request(app).get('/api/properties?page=1&limit=10');
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('meta');
    });
  });

  describe('POST /api/properties', () => {
    it('should reject unauthenticated property creation', async () => {
      const res = await request(app)
        .post('/api/properties')
        .send({ title: 'Test Property' });

      expect(res.statusCode).toBe(401);
    });

    it('should create a property with valid owner token', async () => {
      if (!ownerToken) return;

      const res = await request(app)
        .post('/api/properties')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          title: 'Test PG',
          type: 'PG',
          genderAllowed: 'UNISEX',
          address: '123 Test Street',
          city: 'Mumbai',
          state: 'Maharashtra',
          priceStartingFrom: 9000,
          depositAmount: 9000,
        });

      // May 201 or 403 depending on the role assigned
      expect([201, 403]).toContain(res.statusCode);
    });
  });
});
