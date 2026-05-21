// ─────────────────────────────────────────────────────────────
// Routes — Reviews
// ─────────────────────────────────────────────────────────────

const { Router } = require('express');
const reviewController = require('../controllers/review.controller');
const { authenticate, optionalAuth } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { createReviewSchema, updateReviewSchema } = require('../validators/review.validator');

const router = Router();

// Public
router.get('/property/:id', optionalAuth, reviewController.getByProperty);

// Protected
router.post('/', authenticate, validate(createReviewSchema), reviewController.create);
router.put('/:id', authenticate, validate(updateReviewSchema), reviewController.update);
router.delete('/:id', authenticate, reviewController.delete);

module.exports = router;
