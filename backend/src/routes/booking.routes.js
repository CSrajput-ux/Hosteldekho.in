// ─────────────────────────────────────────────────────────────
// Routes — Booking
// ─────────────────────────────────────────────────────────────

const { Router } = require('express');
const bookingController = require('../controllers/booking.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { createBookingSchema, cancelBookingSchema } = require('../validators/booking.validator');

const router = Router();

router.use(authenticate);

router.post('/', validate(createBookingSchema), bookingController.create);
router.get('/my-bookings', bookingController.getMyBookings);
router.get('/:id', bookingController.getById);
router.patch('/:id/cancel', validate(cancelBookingSchema), bookingController.cancel);
router.patch('/:id/confirm', bookingController.confirm);

module.exports = router;
