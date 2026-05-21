// ─────────────────────────────────────────────────────────────
// Controller — Owner Dashboard
// ─────────────────────────────────────────────────────────────

const prisma = require('../config/database');
const bookingService = require('../services/booking.service');
const { sendSuccess } = require('../utils/apiResponse');
const { parsePagination, buildPaginationMeta } = require('../utils/pagination');

class OwnerController {
  async getDashboard(req, res, next) {
    try {
      const ownerId = req.user.id;

      const [properties, bookings, kycStatus] = await Promise.all([
        prisma.property.findMany({
          where: { ownerId },
          select: { id: true, status: true },
        }),
        prisma.booking.findMany({
          where: {
            property: { ownerId },
            status: { in: ['CONFIRMED', 'CHECKED_IN'] },
          },
          select: { totalPayable: true, status: true },
        }),
        prisma.kyc.findFirst({
          where: { ownerId },
          select: { status: true },
          orderBy: { createdAt: 'desc' },
        }),
      ]);

      const totalProperties = properties.length;
      const activeListings = properties.filter((p) => p.status === 'ACTIVE').length;
      const totalBookings = bookings.length;
      const monthlyRevenue = bookings.reduce((sum, b) => sum + b.totalPayable, 0);

      const unreadMessages = await prisma.message.count({
        where: {
          chat: { ownerId },
          isRead: false,
          senderId: { not: ownerId },
        },
      });

      sendSuccess(res, 200, 'Owner dashboard', {
        totalProperties,
        activeListings,
        pendingKyc: kycStatus?.status || 'NOT_STARTED',
        totalBookings,
        monthlyRevenue,
        unreadMessages,
      });
    } catch (error) {
      next(error);
    }
  }

  async getProperties(req, res, next) {
    try {
      const properties = await prisma.property.findMany({
        where: { ownerId: req.user.id, status: { not: 'DELETED' } },
        orderBy: { createdAt: 'desc' },
        include: {
          images: { take: 1 },
          rooms: { select: { availableBeds: true, totalBeds: true } },
          _count: { select: { bookings: true, reviews: true } },
        },
      });
      sendSuccess(res, 200, 'Owner properties', properties);
    } catch (error) {
      next(error);
    }
  }

  async getBookings(req, res, next) {
    try {
      const pagination = parsePagination(req.query);
      const { bookings, total } = await bookingService.getOwnerBookings(req.user.id, pagination);
      sendSuccess(res, 200, 'Owner bookings', bookings, buildPaginationMeta(total, pagination.page, pagination.limit));
    } catch (error) {
      next(error);
    }
  }

  async updateBookingStatus(req, res, next) {
    try {
      const { status } = req.body;
      const booking = await prisma.booking.update({
        where: { id: req.params.id },
        data: { status },
      });
      sendSuccess(res, 200, 'Booking status updated', booking);
    } catch (error) {
      next(error);
    }
  }

  async getEarnings(req, res, next) {
    try {
      const payments = await prisma.payment.findMany({
        where: {
          booking: { property: { ownerId: req.user.id } },
          status: 'CAPTURED',
        },
        select: { amount: true, paidAt: true },
        orderBy: { paidAt: 'desc' },
      });

      const totalEarnings = payments.reduce((sum, p) => sum + p.amount, 0);

      sendSuccess(res, 200, 'Owner earnings', {
        totalEarnings,
        payments,
      });
    } catch (error) {
      next(error);
    }
  }

  async getLeads(req, res, next) {
    try {
      const leads = await prisma.booking.findMany({
        where: {
          property: { ownerId: req.user.id },
          status: 'PENDING_PAYMENT',
        },
        include: {
          user: { select: { name: true, mobile: true } },
          property: { select: { title: true } },
          room: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
      sendSuccess(res, 200, 'Leads', leads);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new OwnerController();
