// ─────────────────────────────────────────────────────────────
// Routes — User
// ─────────────────────────────────────────────────────────────

const { Router } = require('express');
const userController = require('../controllers/user.controller');
const { authenticate } = require('../middlewares/auth.middleware');

const router = Router();

// All user routes require authentication
router.use(authenticate);

router.get('/me', userController.getMe);
router.put('/me', userController.updateMe);
router.get('/me/bookings', userController.getMyBookings);
router.get('/me/wishlist', userController.getMyWishlist);
router.put('/me/preferences', userController.updatePreferences);
router.delete('/me', userController.deleteMe);

module.exports = router;
