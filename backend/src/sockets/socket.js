// ─────────────────────────────────────────────────────────────
// Socket.IO — Main Initialization
// ─────────────────────────────────────────────────────────────

const { Server } = require('socket.io');
const { verifyAccessToken } = require('../utils/generateToken');
const logger = require('../utils/logger');
const chatSocket = require('./chat.socket');

/**
 * Initialize Socket.IO on the HTTP server
 * @param {import('http').Server} httpServer
 * @returns {import('socket.io').Server}
 */
const initializeSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
  });

  // ── Authentication middleware ──────────────────────────
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;

      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decoded = verifyAccessToken(token);
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      next();
    } catch {
      next(new Error('Invalid authentication token'));
    }
  });

  // ── Connection handler ─────────────────────────────────
  io.on('connection', (socket) => {
    logger.info(`🔌 Socket connected: ${socket.userId}`);

    // Join user's personal room for targeted events
    socket.join(`user:${socket.userId}`);

    // Register chat socket handlers
    chatSocket(io, socket);

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      logger.info(`🔌 Socket disconnected: ${socket.userId} (${reason})`);
    });

    // Error handling
    socket.on('error', (error) => {
      logger.error(`Socket error for ${socket.userId}:`, error);
    });
  });

  logger.info('🔌 Socket.IO initialized');

  return io;
};

module.exports = { initializeSocket };
