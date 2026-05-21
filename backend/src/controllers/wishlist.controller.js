// ─────────────────────────────────────────────────────────────
// Controller — Wishlist
// ─────────────────────────────────────────────────────────────

const prisma = require('../config/database');
const { sendSuccess } = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');

class WishlistController {
  async add(req, res, next) {
    try {
      const { propertyId } = req.params;

      // Verify property exists
      const property = await prisma.property.findUnique({ where: { id: propertyId } });
      if (!property) throw ApiError.notFound('Property not found');

      // Check if already wishlisted
      const existing = await prisma.wishlist.findUnique({
        where: { userId_propertyId: { userId: req.user.id, propertyId } },
      });

      if (existing) {
        return sendSuccess(res, 200, 'Already in wishlist');
      }

      const wishlist = await prisma.wishlist.create({
        data: { userId: req.user.id, propertyId },
      });

      sendSuccess(res, 201, 'Added to wishlist', wishlist);
    } catch (error) {
      next(error);
    }
  }

  async remove(req, res, next) {
    try {
      const { propertyId } = req.params;

      await prisma.wishlist.deleteMany({
        where: { userId: req.user.id, propertyId },
      });

      sendSuccess(res, 200, 'Removed from wishlist');
    } catch (error) {
      next(error);
    }
  }

  async getAll(req, res, next) {
    try {
      const wishlist = await prisma.wishlist.findMany({
        where: { userId: req.user.id },
        include: {
          property: {
            select: {
              id: true, title: true, slug: true, city: true,
              priceStartingFrom: true, totalRating: true, verified: true,
              genderAllowed: true, type: true,
            },
            include: { images: { take: 1 } },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      sendSuccess(res, 200, 'Wishlist', wishlist);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new WishlistController();
