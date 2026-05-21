// ─────────────────────────────────────────────────────────────
// Service — Booking
// Handles booking creation, availability check, status updates
// ─────────────────────────────────────────────────────────────

const prisma = require('../config/database');
const ApiError = require('../utils/apiError');
const { BOOKING_STATUS, CANCELLABLE_STATUSES } = require('../constants/bookingStatus');

class BookingService {
  /**
   * Create a new booking
   */
  async create(userId, { propertyId, roomId, moveInDate, durationMonths }) {
    // Verify property exists and is active
    const property = await prisma.property.findUnique({ where: { id: propertyId } });
    if (!property || property.status !== 'ACTIVE') {
      throw ApiError.notFound('Property not found or not available');
    }

    // Verify room exists and has availability
    const room = await prisma.room.findFirst({
      where: { id: roomId, propertyId },
    });

    if (!room) throw ApiError.notFound('Room not found');
    if (room.availableBeds <= 0) throw ApiError.badRequest('No beds available in this room');

    // Check for duplicate pending bookings
    const existingBooking = await prisma.booking.findFirst({
      where: {
        userId,
        roomId,
        status: { in: [BOOKING_STATUS.PENDING_PAYMENT, BOOKING_STATUS.CONFIRMED] },
      },
    });

    if (existingBooking) {
      throw ApiError.conflict('You already have an active booking for this room');
    }

    // Calculate amount
    const monthlyRent = room.pricePerMonth;
    const depositAmount = room.deposit;
    const platformFee = Math.round(monthlyRent * 0.05); // 5% platform fee
    const totalPayable = monthlyRent + depositAmount + platformFee;

    // Create booking in a transaction
    const booking = await prisma.$transaction(async (tx) => {
      // Decrement available beds
      await tx.room.update({
        where: { id: roomId },
        data: { availableBeds: { decrement: 1 } },
      });

      return tx.booking.create({
        data: {
          userId,
          propertyId,
          roomId,
          moveInDate: new Date(moveInDate),
          durationMonths,
          monthlyRent,
          depositAmount,
          platformFee,
          totalPayable,
          status: BOOKING_STATUS.PENDING_PAYMENT,
        },
        include: {
          property: { select: { id: true, title: true, slug: true, city: true } },
          room: { select: { id: true, name: true, sharingType: true } },
        },
      });
    });

    return booking;
  }

  /**
   * Get booking by ID (with access check)
   */
  async getById(bookingId, userId) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        property: {
          select: { id: true, title: true, slug: true, city: true, address: true },
          include: { images: { take: 1 } },
        },
        room: true,
        payment: true,
        user: { select: { id: true, name: true, mobile: true } },
      },
    });

    if (!booking) throw ApiError.notFound('Booking not found');

    // Only the booking user or property owner can see it
    if (booking.userId !== userId && booking.property.ownerId !== userId) {
      throw ApiError.forbidden('Not authorized to view this booking');
    }

    return booking;
  }

  /**
   * Get user's bookings
   */
  async getMyBookings(userId, { page, limit, skip }) {
    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          property: {
            select: { id: true, title: true, slug: true, city: true },
            include: { images: { take: 1 } },
          },
          room: { select: { name: true, sharingType: true } },
          payment: { select: { status: true, amount: true } },
        },
      }),
      prisma.booking.count({ where: { userId } }),
    ]);

    return { bookings, total };
  }

  /**
   * Cancel a booking
   */
  async cancel(bookingId, userId, cancelReason) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) throw ApiError.notFound('Booking not found');
    if (booking.userId !== userId) throw ApiError.forbidden('Not authorized');

    if (!CANCELLABLE_STATUSES.includes(booking.status)) {
      throw ApiError.badRequest(`Cannot cancel a booking with status: ${booking.status}`);
    }

    return prisma.$transaction(async (tx) => {
      // Restore bed availability
      await tx.room.update({
        where: { id: booking.roomId },
        data: { availableBeds: { increment: 1 } },
      });

      return tx.booking.update({
        where: { id: bookingId },
        data: {
          status: BOOKING_STATUS.CANCELLED,
          cancelReason,
        },
      });
    });
  }

  /**
   * Confirm a booking (after payment)
   */
  async confirm(bookingId) {
    return prisma.booking.update({
      where: { id: bookingId },
      data: { status: BOOKING_STATUS.CONFIRMED },
    });
  }

  /**
   * Get bookings for an owner's properties
   */
  async getOwnerBookings(ownerId, { page, limit, skip }) {
    const ownerProperties = await prisma.property.findMany({
      where: { ownerId },
      select: { id: true },
    });

    const propertyIds = ownerProperties.map((p) => p.id);

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where: { propertyId: { in: propertyIds } },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          property: { select: { title: true, city: true } },
          room: { select: { name: true, sharingType: true } },
          user: { select: { name: true, mobile: true } },
          payment: { select: { status: true, amount: true } },
        },
      }),
      prisma.booking.count({ where: { propertyId: { in: propertyIds } } }),
    ]);

    return { bookings, total };
  }
}

module.exports = new BookingService();
