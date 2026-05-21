// ─────────────────────────────────────────────────────────────
// HostelDekho — Express Application
// All middleware, routes, and error handlers
// ─────────────────────────────────────────────────────────────

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const path = require('path');

const env = require('./config/env');
const { generalLimiter } = require('./middlewares/rateLimit.middleware');
const { errorHandler, notFoundHandler } = require('./middlewares/error.middleware');

// ── Route imports ────────────────────────────────────────
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const propertyRoutes = require('./routes/property.routes');
const searchRoutes = require('./routes/search.routes');
const bookingRoutes = require('./routes/booking.routes');
const paymentRoutes = require('./routes/payment.routes');
const ownerRoutes = require('./routes/owner.routes');
const kycRoutes = require('./routes/kyc.routes');
const reviewRoutes = require('./routes/review.routes');
const chatRoutes = require('./routes/chat.routes');
const wishlistRoutes = require('./routes/wishlist.routes');
const adminRoutes = require('./routes/admin.routes');

// ── Initialize Express ──────────────────────────────────
const app = express();

// ── Security headers ────────────────────────────────────
app.use(helmet());

// ── CORS ────────────────────────────────────────────────
app.use(cors({
  origin: [env.FRONTEND_URL, 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Body parsers ────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ── Request logging ─────────────────────────────────────
if (env.isDevelopment) {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// ── Rate limiting ───────────────────────────────────────
app.use('/api', generalLimiter);

// ── Static files ────────────────────────────────────────
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

// ── Health check ────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    message: 'HostelDekho API is running',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  });
});

// ── API Routes ──────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/owner', ownerRoutes);
app.use('/api/kyc', kycRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/admin', adminRoutes);

// ── Recommendation route (inline) ───────────────────────
const recommendationService = require('./services/recommendation.service');
const { authenticate } = require('./middlewares/auth.middleware');
const { sendSuccess } = require('./utils/apiResponse');

app.get('/api/recommendations', authenticate, async (req, res, next) => {
  try {
    const recommendations = await recommendationService.getRecommendations(req.user.id);
    sendSuccess(res, 200, 'Recommendations', recommendations);
  } catch (error) {
    next(error);
  }
});

app.post('/api/recommendations/feedback', authenticate, async (req, res, next) => {
  try {
    const result = await recommendationService.recordFeedback(req.user.id, req.body.propertyId, req.body.feedback);
    sendSuccess(res, 200, 'Feedback recorded', result);
  } catch (error) {
    next(error);
  }
});

// ── Trust stats (public — for landing page) ─────────────
app.get('/api/stats/trust', async (_req, res, next) => {
  try {
    const prisma = require('./config/database');
    const [properties, users, bookings, reviews] = await Promise.all([
      prisma.property.count({ where: { status: 'ACTIVE', verified: true } }),
      prisma.user.count(),
      prisma.booking.count({ where: { status: 'CONFIRMED' } }),
      prisma.review.count(),
    ]);
    sendSuccess(res, 200, 'Trust stats', {
      verifiedProperties: properties,
      happyUsers: users,
      confirmedBookings: bookings,
      totalReviews: reviews,
    });
  } catch (error) {
    next(error);
  }
});

// ── 404 handler ─────────────────────────────────────────
app.use(notFoundHandler);

// ── Global error handler ────────────────────────────────
app.use(errorHandler);

module.exports = app;
