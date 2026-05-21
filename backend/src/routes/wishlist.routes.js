// ─────────────────────────────────────────────────────────────
// Routes — Wishlist
// ─────────────────────────────────────────────────────────────

const { Router } = require('express');
const wishlistController = require('../controllers/wishlist.controller');
const { authenticate } = require('../middlewares/auth.middleware');

const router = Router();

router.use(authenticate);

router.post('/:propertyId', wishlistController.add);
router.delete('/:propertyId', wishlistController.remove);
router.get('/', wishlistController.getAll);

module.exports = router;
