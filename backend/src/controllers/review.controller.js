// ─────────────────────────────────────────────────────────────
// Controller — Reviews
// ─────────────────────────────────────────────────────────────

const prisma = require('../config/database');
const { sendSuccess } = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');

class ReviewController {
  async create(req, res, next) {
    try {
      const { propertyId, bookingId, rating, comment } = req.body;

      // Verify user has a completed booking for this property (optional enforcement)
      if (bookingId) {
        const booking = await prisma.booking.findFirst({
          where: { id: bookingId, userId: req.user.id, propertyId, status: 'COMPLETED' },
        });
        if (!booking) throw ApiError.badRequest('You can only review properties you have stayed at');
      }

      // Check for duplicate review
      const existing = await prisma.review.findFirst({
        where: { userId: req.user.id, propertyId },
      });
      if (existing) throw ApiError.conflict('You have already reviewed this property');

      const review = await prisma.review.create({
        data: { userId: req.user.id, propertyId, bookingId, rating, comment },
        include: { user: { select: { id: true, name: true, profileImage: true } } },
      });

      // Update property rating
      const agg = await prisma.review.aggregate({
        where: { propertyId },
        _avg: { rating: true },
        _count: { id: true },
      });

      await prisma.property.update({
        where: { id: propertyId },
        data: {
          totalRating: Math.round((agg._avg.rating || 0) * 10) / 10,
          totalReviews: agg._count.id,
        },
      });

      sendSuccess(res, 201, 'Review submitted', review);
    } catch (error) {
      next(error);
    }
  }

  async getByProperty(req, res, next) {
    try {
      const reviews = await prisma.review.findMany({
        where: { propertyId: req.params.id, isApproved: true },
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, name: true, profileImage: true } } },
      });
      sendSuccess(res, 200, 'Property reviews', reviews);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const review = await prisma.review.findUnique({ where: { id: req.params.id } });
      if (!review) throw ApiError.notFound('Review not found');
      if (review.userId !== req.user.id) throw ApiError.forbidden('Not authorized');

      const updated = await prisma.review.update({
        where: { id: req.params.id },
        data: { rating: req.body.rating, comment: req.body.comment },
      });
      sendSuccess(res, 200, 'Review updated', updated);
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const review = await prisma.review.findUnique({ where: { id: req.params.id } });
      if (!review) throw ApiError.notFound('Review not found');
      if (review.userId !== req.user.id && req.user.role !== 'ADMIN') {
        throw ApiError.forbidden('Not authorized');
      }

      await prisma.review.delete({ where: { id: req.params.id } });
      sendSuccess(res, 200, 'Review deleted');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ReviewController();
