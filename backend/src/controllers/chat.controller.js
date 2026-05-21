// ─────────────────────────────────────────────────────────────
// Controller — Chat
// ─────────────────────────────────────────────────────────────

const chatService = require('../services/chat.service');
const { sendSuccess } = require('../utils/apiResponse');

class ChatController {
  async getChats(req, res, next) {
    try {
      const chats = await chatService.getUserChats(req.user.id);
      sendSuccess(res, 200, 'Chats', chats);
    } catch (error) {
      next(error);
    }
  }

  async createChat(req, res, next) {
    try {
      const { ownerId, propertyId } = req.body;
      const chat = await chatService.getOrCreateChat(req.user.id, ownerId, propertyId);
      sendSuccess(res, 201, 'Chat created', chat);
    } catch (error) {
      next(error);
    }
  }

  async getMessages(req, res, next) {
    try {
      const messages = await chatService.getMessages(req.params.chatId, req.user.id, {
        skip: parseInt(req.query.skip, 10) || 0,
        limit: parseInt(req.query.limit, 10) || 50,
      });
      sendSuccess(res, 200, 'Messages', messages);
    } catch (error) {
      next(error);
    }
  }

  async sendMessage(req, res, next) {
    try {
      const message = await chatService.sendMessage(req.params.chatId, req.user.id, req.body.content);
      sendSuccess(res, 201, 'Message sent', message);
    } catch (error) {
      next(error);
    }
  }

  async markAsRead(req, res, next) {
    try {
      await chatService.markAsRead(req.params.chatId, req.user.id);
      sendSuccess(res, 200, 'Messages marked as read');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ChatController();
