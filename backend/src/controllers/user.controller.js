// ─────────────────────────────────────────────────────────────
// Controller — User Profile
// ─────────────────────────────────────────────────────────────

const prisma = require('../config/database');
const { sendSuccess } = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');

class UserController {
  async getMe(req, res, next) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          id: true, name: true, email: true, mobile: true, role: true,
          gender: true, city: true, occupation: true, collegeOrCompany: true,
          budgetRange: true, preferredLocation: true, foodPreference: true,
          profileImage: true, createdAt: true,
        },
      });
      sendSuccess(res, 200, 'User profile', user);
    } catch (error) {
      next(error);
    }
  }

  async updateMe(req, res, next) {
    try {
      const allowedFields = [
        'name', 'email', 'gender', 'city', 'occupation',
        'collegeOrCompany', 'budgetRange', 'preferredLocation',
        'foodPreference', 'profileImage',
      ];

      const data = {};
      allowedFields.forEach((field) => {
        if (req.body[field] !== undefined) data[field] = req.body[field];
      });

      const user = await prisma.user.update({
        where: { id: req.user.id },
        data,
        select: {
          id: true, name: true, email: true, mobile: true, role: true,
          gender: true, city: true, occupation: true, profileImage: true,
        },
      });

      sendSuccess(res, 200, 'Profile updated', user);
    } catch (error) {
      next(error);
    }
  }

  async getMyBookings(req, res, next) {
    try {
      const bookings = await prisma.booking.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' },
        include: {
          property: { select: { title: true, city: true, slug: true }, include: { images: { take: 1 } } },
          room: { select: { name: true, sharingType: true } },
          payment: { select: { status: true, amount: true } },
        },
      });
      sendSuccess(res, 200, 'My bookings', bookings);
    } catch (error) {
      next(error);
    }
  }

  async getMyWishlist(req, res, next) {
    try {
      const wishlist = await prisma.wishlist.findMany({
        where: { userId: req.user.id },
        include: {
          property: {
            select: { id: true, title: true, slug: true, city: true, priceStartingFrom: true, totalRating: true },
            include: { images: { take: 1 } },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      sendSuccess(res, 200, 'My wishlist', wishlist);
    } catch (error) {
      next(error);
    }
  }

  async updatePreferences(req, res, next) {
    try {
      const { budgetRange, preferredLocation, foodPreference, occupation, collegeOrCompany } = req.body;

      const user = await prisma.user.update({
        where: { id: req.user.id },
        data: { budgetRange, preferredLocation, foodPreference, occupation, collegeOrCompany },
        select: { id: true, budgetRange: true, preferredLocation: true, foodPreference: true },
      });

      sendSuccess(res, 200, 'Preferences updated', user);
    } catch (error) {
      next(error);
    }
  }

  async deleteMe(req, res, next) {
    try {
      await prisma.user.update({
        where: { id: req.user.id },
        data: { isActive: false },
      });
      sendSuccess(res, 200, 'Account deactivated');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController();
