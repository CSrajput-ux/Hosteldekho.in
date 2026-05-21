// ─────────────────────────────────────────────────────────────
// Service — Search
// Full-text search, geo-based filtering, and map pins
// ─────────────────────────────────────────────────────────────

const prisma = require('../config/database');
const redis = require('../config/redis');
const { calculateDistance } = require('../utils/calculateDistance');
const logger = require('../utils/logger');

const CACHE_TTL = 300; // 5 minutes

class SearchService {
  /**
   * Search properties with filters, pagination, and geo support
   */
  async searchProperties(query) {
    const {
      location, lat, lng, radius,
      minPrice, maxPrice, gender, type,
      food, ac, wifi, rating, verified,
      sort, page = 1, limit = 20,
    } = query;

    // Try cache first
    const cacheKey = `search:${JSON.stringify(query)}`;
    if (redis) {
      try {
        const cached = await redis.get(cacheKey);
        if (cached) {
          logger.debug('Search cache hit');
          return JSON.parse(cached);
        }
      } catch {
        // Continue without cache
      }
    }

    // Build where clause
    const where = { status: 'ACTIVE' };

    if (location) {
      where.city = { contains: location, mode: 'insensitive' };
    }

    if (minPrice || maxPrice) {
      where.priceStartingFrom = {};
      if (minPrice) where.priceStartingFrom.gte = parseInt(minPrice, 10);
      if (maxPrice) where.priceStartingFrom.lte = parseInt(maxPrice, 10);
    }

    if (gender) {
      where.genderAllowed = gender.toUpperCase();
    }

    if (type) {
      where.type = type.toUpperCase();
    }

    if (food === 'true') where.foodIncluded = true;
    if (ac === 'true') where.acAvailable = true;
    if (wifi === 'true') where.wifiIncluded = true;
    if (verified === 'true') where.verified = true;

    if (rating) {
      where.totalRating = { gte: parseFloat(rating) };
    }

    // Build order
    let orderBy = { createdAt: 'desc' };
    if (sort === 'price_low_to_high') orderBy = { priceStartingFrom: 'asc' };
    if (sort === 'price_high_to_low') orderBy = { priceStartingFrom: 'desc' };
    if (sort === 'rating') orderBy = { totalRating: 'desc' };
    if (sort === 'newest') orderBy = { createdAt: 'desc' };

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const [results, total] = await Promise.all([
      prisma.property.findMany({
        where,
        skip,
        take: parseInt(limit, 10),
        orderBy,
        include: {
          images: { take: 1, orderBy: { order: 'asc' } },
          rooms: { select: { pricePerMonth: true, availableBeds: true, sharingType: true } },
          _count: { select: { reviews: true } },
        },
      }),
      prisma.property.count({ where }),
    ]);

    // Filter by radius if coordinates provided
    let filteredResults = results;
    if (lat && lng && radius) {
      const centerLat = parseFloat(lat);
      const centerLng = parseFloat(lng);
      const maxRadius = parseFloat(radius);

      filteredResults = results.filter((prop) => {
        if (!prop.latitude || !prop.longitude) return false;
        const dist = calculateDistance(centerLat, centerLng, prop.latitude, prop.longitude);
        prop.distance = dist;
        return dist <= maxRadius;
      });

      // Sort by distance if geo-search
      filteredResults.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    }

    // Build map pins
    const mapPins = filteredResults
      .filter((p) => p.latitude && p.longitude)
      .map((p) => ({
        id: p.id,
        lat: p.latitude,
        lng: p.longitude,
        price: p.priceStartingFrom,
        title: p.title,
      }));

    const response = {
      results: filteredResults,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
      },
      mapPins,
    };

    // Cache the result
    if (redis) {
      try {
        await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(response));
      } catch {
        // Silently ignore cache write errors
      }
    }

    // Log search (async, non-blocking)
    prisma.searchLog.create({
      data: {
        query: location || '',
        filters: query,
        results: total,
      },
    }).catch(() => {});

    return response;
  }

  /**
   * Get filter options for the search sidebar
   */
  async getFilterOptions() {
    const [types, cities, priceRange] = await Promise.all([
      prisma.property.groupBy({
        by: ['type'],
        where: { status: 'ACTIVE' },
        _count: { id: true },
      }),
      prisma.property.groupBy({
        by: ['city'],
        where: { status: 'ACTIVE' },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 20,
      }),
      prisma.property.aggregate({
        where: { status: 'ACTIVE' },
        _min: { priceStartingFrom: true },
        _max: { priceStartingFrom: true },
      }),
    ]);

    return {
      types: types.map((t) => ({ value: t.type, count: t._count.id })),
      cities: cities.map((c) => ({ value: c.city, count: c._count.id })),
      priceRange: {
        min: priceRange._min.priceStartingFrom || 0,
        max: priceRange._max.priceStartingFrom || 50000,
      },
    };
  }
}

module.exports = new SearchService();
