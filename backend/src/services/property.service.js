// ─────────────────────────────────────────────────────────────
// Service — Property
// CRUD for properties + image management
// ─────────────────────────────────────────────────────────────

const prisma = require('../config/database');
const ApiError = require('../utils/apiError');
const { createSlug } = require('../utils/slugify');
const uploadService = require('./upload.service');

class PropertyService {
  /**
   * Create a new property
   */
  async create(ownerId, data) {
    const slug = createSlug(data.title);

    // Automatically upgrade USER to OWNER role
    const user = await prisma.user.findUnique({ where: { id: ownerId } });
    if (user && user.role === 'USER') {
      await prisma.user.update({
        where: { id: ownerId },
        data: { role: 'OWNER' }
      });
    }

    const property = await prisma.property.create({
      data: {
        ...data,
        ownerId,
        slug,
      },
      include: {
        owner: { select: { id: true, name: true, mobile: true, role: true } },
        rooms: true,
        images: true,
      },
    });

    return property;
  }

  /**
   * Get all properties with pagination and optional filters
   */
  async getAll({ page, limit, skip, status, type, city, verified }) {
    const where = {};

    if (status) where.status = status;
    if (type) where.type = type;
    if (city) where.city = { contains: city, mode: 'insensitive' };
    if (verified !== undefined) where.verified = verified === 'true';

    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          images: { take: 1, orderBy: { order: 'asc' } },
          rooms: { select: { pricePerMonth: true, availableBeds: true } },
          _count: { select: { reviews: true, bookings: true } },
        },
      }),
      prisma.property.count({ where }),
    ]);

    return { properties, total };
  }

  /**
   * Get a single property by ID or slug
   */
  async getById(idOrSlug) {
    const where = idOrSlug.length > 20
      ? { id: idOrSlug }
      : { slug: idOrSlug };

    const property = await prisma.property.findFirst({
      where,
      include: {
        owner: { 
          select: { 
            id: true, 
            name: true, 
            mobile: true, 
            profileImage: true,
            kycDocuments: {
              take: 1,
              orderBy: { createdAt: 'desc' }
            }
          } 
        },
        rooms: true,
        images: { orderBy: { order: 'asc' } },
        reviews: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { id: true, name: true, profileImage: true } } },
        },
        _count: { select: { reviews: true, bookings: true, wishlist: true } },
      },
    });

    if (!property) {
      throw ApiError.notFound('Property not found');
    }

    return property;
  }

  /**
   * Update property (owner only)
   */
  async update(propertyId, ownerId, data) {
    const property = await prisma.property.findUnique({ where: { id: propertyId } });

    if (!property) throw ApiError.notFound('Property not found');
    if (property.ownerId !== ownerId) throw ApiError.forbidden('You can only update your own properties');

    // Generate new slug if title changed
    if (data.title && data.title !== property.title) {
      data.slug = createSlug(data.title);
    }

    return prisma.property.update({
      where: { id: propertyId },
      data,
      include: { rooms: true, images: true },
    });
  }

  /**
   * Delete property (soft delete)
   */
  async delete(propertyId, ownerId) {
    const property = await prisma.property.findUnique({ where: { id: propertyId } });

    if (!property) throw ApiError.notFound('Property not found');
    if (property.ownerId !== ownerId) throw ApiError.forbidden('You can only delete your own properties');

    return prisma.property.update({
      where: { id: propertyId },
      data: { status: 'DELETED' },
    });
  }

  /**
   * Update property status (admin)
   */
  async updateStatus(propertyId, status) {
    const property = await prisma.property.findUnique({ where: { id: propertyId } });
    if (!property) throw ApiError.notFound('Property not found');

    return prisma.property.update({
      where: { id: propertyId },
      data: { status },
    });
  }

  /**
   * Add images to a property
   */
  async addImages(propertyId, ownerId, files) {
    const property = await prisma.property.findUnique({ where: { id: propertyId } });

    if (!property) throw ApiError.notFound('Property not found');
    if (property.ownerId !== ownerId) throw ApiError.forbidden('Not authorized');

    const uploadResults = await Promise.all(
      files.map((file) => uploadService.uploadImage(file.path, 'hosteldekho/properties'))
    );

    const images = await prisma.$transaction(
      uploadResults.map((result, index) =>
        prisma.propertyImage.create({
          data: {
            propertyId,
            url: result.secure_url,
            publicId: result.public_id,
            order: index,
          },
        })
      )
    );

    return images;
  }

  /**
   * Remove an image from a property
   */
  async removeImage(propertyId, imageId, ownerId) {
    const property = await prisma.property.findUnique({ where: { id: propertyId } });
    if (!property) throw ApiError.notFound('Property not found');
    if (property.ownerId !== ownerId) throw ApiError.forbidden('Not authorized');

    const image = await prisma.propertyImage.findFirst({
      where: { id: imageId, propertyId },
    });

    if (!image) throw ApiError.notFound('Image not found');

    if (image.publicId) {
      await uploadService.deleteImage(image.publicId);
    }

    await prisma.propertyImage.delete({ where: { id: imageId } });

    return { message: 'Image removed successfully' };
  }

  /**
   * Get featured properties
   */
  async getFeatured(limit = 6) {
    return prisma.property.findMany({
      where: { status: 'ACTIVE', isFeatured: true },
      take: limit,
      orderBy: { totalRating: 'desc' },
      include: {
        images: { take: 1, orderBy: { order: 'asc' } },
        rooms: { select: { pricePerMonth: true } },
      },
    });
  }

  /**
   * Get property categories with counts
   */
  async getCategories() {
    const categories = await prisma.property.groupBy({
      by: ['type'],
      where: { status: 'ACTIVE' },
      _count: { id: true },
    });

    return categories.map((cat) => ({
      type: cat.type,
      count: cat._count.id,
    }));
  }
}

module.exports = new PropertyService();
