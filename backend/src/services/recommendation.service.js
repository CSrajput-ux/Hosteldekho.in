// ─────────────────────────────────────────────────────────────
// Service — AI Recommendation
// MVP scoring algorithm for "Best for you" section
// ─────────────────────────────────────────────────────────────

const prisma = require('../config/database');
const { calculateDistance } = require('../utils/calculateDistance');

class RecommendationService {
  /**
   * Get personalized property recommendations
   * MVP scoring: price match + location distance + rating + verified + amenities + popularity
   */
  async getRecommendations(userId, limit = 10) {
    // Fetch user preferences
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        city: true,
        gender: true,
        budgetRange: true,
        preferredLocation: true,
        foodPreference: true,
        occupation: true,
        collegeOrCompany: true,
      },
    });

    // Fetch user's past interactions
    const [wishlisted, viewed, booked] = await Promise.all([
      prisma.wishlist.findMany({
        where: { userId },
        select: { propertyId: true },
      }),
      prisma.searchLog.findMany({
        where: { userId },
        take: 20,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.booking.findMany({
        where: { userId },
        select: { propertyId: true },
      }),
    ]);

    // Get active properties
    const properties = await prisma.property.findMany({
      where: { status: 'ACTIVE' },
      include: {
        rooms: { select: { pricePerMonth: true, availableBeds: true } },
        images: { take: 1 },
        _count: { select: { reviews: true, bookings: true } },
      },
    });

    // Score each property
    const scored = properties.map((property) => {
      let score = 0;

      // 1. Price match (0-25 points)
      if (user?.budgetRange) {
        const [minStr, maxStr] = user.budgetRange.split('-').map((s) => parseInt(s, 10));
        if (property.priceStartingFrom >= (minStr || 0) && property.priceStartingFrom <= (maxStr || 100000)) {
          score += 25;
        } else {
          const diff = Math.abs(property.priceStartingFrom - ((minStr + maxStr) / 2 || 10000));
          score += Math.max(0, 25 - Math.floor(diff / 1000));
        }
      }

      // 2. City match (0-20 points)
      if (user?.city && property.city.toLowerCase().includes(user.city.toLowerCase())) {
        score += 20;
      }

      // 3. Rating (0-15 points)
      score += Math.min(15, Math.round(property.totalRating * 3));

      // 4. Verified bonus (10 points)
      if (property.verified) score += 10;

      // 5. Gender match (0-10 points)
      if (user?.gender) {
        const genderMap = { male: 'BOYS', female: 'GIRLS' };
        if (property.genderAllowed === 'UNISEX' || property.genderAllowed === genderMap[user.gender]) {
          score += 10;
        }
      }

      // 6. Food preference (0-5 points)
      if (user?.foodPreference === 'included' && property.foodIncluded) {
        score += 5;
      }

      // 7. Popularity (0-10 points)
      score += Math.min(10, property._count.bookings);

      // 8. Availability bonus (5 points)
      const hasAvailability = property.rooms.some((r) => r.availableBeds > 0);
      if (hasAvailability) score += 5;

      // 9. Already wishlisted penalty (avoid showing saved ones)
      const isWishlisted = wishlisted.some((w) => w.propertyId === property.id);
      if (isWishlisted) score -= 5;

      // 10. Already booked penalty
      const isBooked = booked.some((b) => b.propertyId === property.id);
      if (isBooked) score -= 10;

      return { ...property, score };
    });

    // Sort by score descending, take top N
    scored.sort((a, b) => b.score - a.score);

    return scored.slice(0, limit);
  }

  /**
   * Record recommendation feedback
   */
  async recordFeedback(userId, propertyId, feedback) {
    // Store for ML training later
    // For MVP, this is a no-op placeholder
    return { recorded: true, userId, propertyId, feedback };
  }
}

module.exports = new RecommendationService();
