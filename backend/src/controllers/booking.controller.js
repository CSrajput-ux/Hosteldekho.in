// ─────────────────────────────────────────────────────────────
// Controller — Booking
// ─────────────────────────────────────────────────────────────

const bookingService = require('../services/booking.service');
const { sendSuccess } = require('../utils/apiResponse');
const { parsePagination, buildPaginationMeta } = require('../utils/pagination');

class BookingController {
  async create(req, res, next) {
    try {
      const booking = await bookingService.create(req.user.id, req.body);
      sendSuccess(res, 201, 'Booking created', booking);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const booking = await bookingService.getById(req.params.id, req.user.id);
      sendSuccess(res, 200, 'Booking details', booking);
    } catch (error) {
      next(error);
    }
  }

  async getMyBookings(req, res, next) {
    try {
      const pagination = parsePagination(req.query);
      const { bookings, total } = await bookingService.getMyBookings(req.user.id, pagination);
      sendSuccess(res, 200, 'My bookings', bookings, buildPaginationMeta(total, pagination.page, pagination.limit));
    } catch (error) {
      next(error);
    }
  }

  async cancel(req, res, next) {
    try {
      const booking = await bookingService.cancel(req.params.id, req.user.id, req.body.cancelReason);
      sendSuccess(res, 200, 'Booking cancelled', booking);
    } catch (error) {
      next(error);
    }
  }

  async confirm(req, res, next) {
    try {
      const booking = await bookingService.confirm(req.params.id);
      sendSuccess(res, 200, 'Booking confirmed', booking);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new BookingController();
