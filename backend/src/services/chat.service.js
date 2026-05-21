// ─────────────────────────────────────────────────────────────
// Service — Chat
// Conversation management between users and owners
// ─────────────────────────────────────────────────────────────

const prisma = require('../config/database');
const ApiError = require('../utils/apiError');

class ChatService {
  /**
   * Get or create a chat between user and owner for a property
   */
  async getOrCreateChat(userId, ownerId, propertyId) {
    let chat = await prisma.chat.findFirst({
      where: { userId, ownerId, propertyId },
      include: {
        messages: { take: 30, orderBy: { createdAt: 'desc' } },
        property: { select: { title: true, slug: true } },
        user: { select: { id: true, name: true, profileImage: true } },
        owner: { select: { id: true, name: true, profileImage: true } },
      },
    });

    if (!chat) {
      chat = await prisma.chat.create({
        data: { userId, ownerId, propertyId },
        include: {
          property: { select: { title: true, slug: true } },
          user: { select: { id: true, name: true, profileImage: true } },
          owner: { select: { id: true, name: true, profileImage: true } },
        },
      });
      chat.messages = [];
    }

    return chat;
  }

  /**
   * Get all chats for a user (as user or owner)
   */
  async getUserChats(userId) {
    const chats = await prisma.chat.findMany({
      where: {
        OR: [{ userId }, { ownerId: userId }],
      },
      orderBy: { lastMessageAt: 'desc' },
      include: {
        property: { select: { title: true, slug: true } },
        user: { select: { id: true, name: true, profileImage: true } },
        owner: { select: { id: true, name: true, profileImage: true } },
        messages: { take: 1, orderBy: { createdAt: 'desc' } },
        _count: {
          select: {
            messages: { where: { isRead: false, senderId: { not: userId } } },
          },
        },
      },
    });

    return chats;
  }

  /**
   * Get messages of a chat
   */
  async getMessages(chatId, userId, { skip = 0, limit = 50 }) {
    const chat = await prisma.chat.findUnique({ where: { id: chatId } });
    if (!chat) throw ApiError.notFound('Chat not found');
    if (chat.userId !== userId && chat.ownerId !== userId) {
      throw ApiError.forbidden('Not authorized');
    }

    const messages = await prisma.message.findMany({
      where: { chatId },
      skip,
      take: limit,
      orderBy: { createdAt: 'asc' },
      include: {
        sender: { select: { id: true, name: true, profileImage: true } },
      },
    });

    return messages;
  }

  /**
   * Send a message
   */
  async sendMessage(chatId, senderId, content) {
    const chat = await prisma.chat.findUnique({ where: { id: chatId } });
    if (!chat) throw ApiError.notFound('Chat not found');
    if (chat.userId !== senderId && chat.ownerId !== senderId) {
      throw ApiError.forbidden('Not authorized');
    }

    const [message] = await prisma.$transaction([
      prisma.message.create({
        data: { chatId, senderId, content },
        include: {
          sender: { select: { id: true, name: true, profileImage: true } },
        },
      }),
      prisma.chat.update({
        where: { id: chatId },
        data: { lastMessage: content, lastMessageAt: new Date() },
      }),
    ]);

    return message;
  }

  /**
   * Mark messages as read
   */
  async markAsRead(chatId, userId) {
    return prisma.message.updateMany({
      where: {
        chatId,
        senderId: { not: userId },
        isRead: false,
      },
      data: { isRead: true },
    });
  }
}

module.exports = new ChatService();
