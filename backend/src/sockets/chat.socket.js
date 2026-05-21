// ─────────────────────────────────────────────────────────────
// Socket.IO — Chat Events
// Real-time messaging between users and owners
// ─────────────────────────────────────────────────────────────

const chatService = require('../services/chat.service');
const logger = require('../utils/logger');

/**
 * Register chat-related socket events
 * @param {import('socket.io').Server} io
 * @param {import('socket.io').Socket} socket
 */
const chatSocket = (io, socket) => {
  // ── Join a chat room ───────────────────────────────────
  socket.on('chat:join', (chatId) => {
    socket.join(`chat:${chatId}`);
    logger.debug(`User ${socket.userId} joined chat:${chatId}`);
  });

  // ── Leave a chat room ─────────────────────────────────
  socket.on('chat:leave', (chatId) => {
    socket.leave(`chat:${chatId}`);
  });

  // ── Send a message ────────────────────────────────────
  socket.on('message:send', async ({ chatId, content }) => {
    try {
      const message = await chatService.sendMessage(chatId, socket.userId, content);

      // Broadcast to all participants in the chat room
      io.to(`chat:${chatId}`).emit('message:received', message);
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  // ── Mark messages as read ─────────────────────────────
  socket.on('message:read', async ({ chatId }) => {
    try {
      await chatService.markAsRead(chatId, socket.userId);
      io.to(`chat:${chatId}`).emit('message:read', {
        chatId,
        readBy: socket.userId,
      });
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  // ── Typing indicators ─────────────────────────────────
  socket.on('user:typing', ({ chatId }) => {
    socket.to(`chat:${chatId}`).emit('user:typing', {
      chatId,
      userId: socket.userId,
    });
  });

  socket.on('user:stop-typing', ({ chatId }) => {
    socket.to(`chat:${chatId}`).emit('user:stop-typing', {
      chatId,
      userId: socket.userId,
    });
  });

  // ── Owner online status ───────────────────────────────
  socket.on('owner:online', () => {
    socket.broadcast.emit('owner:online', { ownerId: socket.userId });
  });
};

module.exports = chatSocket;
