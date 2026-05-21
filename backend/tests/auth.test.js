// ─────────────────────────────────────────────────────────────
// Tests — Auth Module
// ─────────────────────────────────────────────────────────────

const request = require('supertest');
const app = require('../src/app');

describe('Auth API', () => {
  describe('POST /api/auth/signup', () => {
    it('should create a new user with valid data', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'Test User',
          mobile: '9876500001',
          role: 'USER',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('refreshToken');
      expect(res.body.data.user.name).toBe('Test User');
    });

    it('should reject signup with invalid mobile', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'Test User',
          mobile: '1234',
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject duplicate mobile number', async () => {
      // First signup
      await request(app).post('/api/auth/signup').send({ name: 'User A', mobile: '9876500002' });

      // Duplicate
      const res = await request(app)
        .post('/api/auth/signup')
        .send({ name: 'User B', mobile: '9876500002' });

      expect(res.statusCode).toBe(409);
    });
  });

  describe('POST /api/auth/send-otp', () => {
    it('should send OTP for valid mobile', async () => {
      const res = await request(app)
        .post('/api/auth/send-otp')
        .send({ mobile: '9876500003' });

      expect(res.statusCode).toBe(200);
      expect(res.body.data).toHaveProperty('expiresIn');
    });

    it('should reject invalid mobile format', async () => {
      const res = await request(app)
        .post('/api/auth/send-otp')
        .send({ mobile: 'abc123' });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('POST /api/auth/refresh-token', () => {
    it('should reject invalid refresh token', async () => {
      const res = await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken: 'invalid_token' });

      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const res = await request(app).get('/api/health');

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('HostelDekho API is running');
    });
  });
});
