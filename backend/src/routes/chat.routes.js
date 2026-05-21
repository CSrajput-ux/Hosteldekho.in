// ─────────────────────────────────────────────────────────────
// Routes — Chat
// ─────────────────────────────────────────────────────────────

const { Router } = require('express');
const chatController = require('../controllers/chat.controller');
const { authenticate } = require('../middlewares/auth.middleware');

const router = Router();

router.use(authenticate);

router.get('/', chatController.getChats);
router.post('/', chatController.createChat);
router.get('/:chatId/messages', chatController.getMessages);
router.post('/:chatId/messages', chatController.sendMessage);
router.patch('/:chatId/read', chatController.markAsRead);

module.exports = router;
