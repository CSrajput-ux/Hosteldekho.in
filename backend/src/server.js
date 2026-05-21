// ─────────────────────────────────────────────────────────────
// HostelDekho — HTTP Server + Socket.IO
// ─────────────────────────────────────────────────────────────

const http = require('http');
const app = require('./app');
const env = require('./config/env');
const logger = require('./utils/logger');
const { initializeSocket } = require('./sockets/socket');

// ── Background Jobs ─────────────────────────────────────
const bookingReminderJob = require('./jobs/bookingReminder.job');
const paymentStatusJob = require('./jobs/paymentStatus.job');
const kycReviewJob = require('./jobs/kycReview.job');
const cleanupOtpJob = require('./jobs/cleanupOtp.job');

// ── Create HTTP server ──────────────────────────────────
const server = http.createServer(app);

// ── Initialize Socket.IO ────────────────────────────────
const io = initializeSocket(server);
app.set('io', io); // Make io accessible in controllers

// ── Start background jobs ───────────────────────────────
bookingReminderJob();
paymentStatusJob();
kycReviewJob();
cleanupOtpJob();

// ── Start server ────────────────────────────────────────
const PORT = env.PORT;

server.listen(PORT, () => {
  logger.info(`
  ╔══════════════════════════════════════════════╗
  ║                                              ║
  ║    🏠 HostelDekho Backend Server             ║
  ║                                              ║
  ║    Environment : ${env.NODE_ENV.padEnd(26)}║
  ║    Port        : ${String(PORT).padEnd(26)}║
  ║    API         : http://localhost:${PORT}/api    ║
  ║    Health      : http://localhost:${PORT}/api/health ║
  ║                                              ║
  ╚══════════════════════════════════════════════╝
  `);
});

// ── Graceful shutdown ───────────────────────────────────
const gracefulShutdown = async (signal) => {
  logger.info(`\n${signal} received. Shutting down gracefully...`);

  server.close(() => {
    logger.info('HTTP server closed');
  });

  // Close database connection
  try {
    const prisma = require('./config/database');
    await prisma.$disconnect();
    logger.info('Database connection closed');
  } catch (err) {
    logger.error('Error closing database:', err);
  }

  // Close Redis
  try {
    const redis = require('./config/redis');
    if (redis) await redis.quit();
    logger.info('Redis connection closed');
  } catch (err) {
    logger.error('Error closing Redis:', err);
  }

  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ── Unhandled errors ────────────────────────────────────
process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION:', err);
  process.exit(1);
});

module.exports = server;
