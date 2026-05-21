// ─────────────────────────────────────────────────────────────
// Controller — Property
// ─────────────────────────────────────────────────────────────

const propertyService = require('../services/property.service');
const { sendSuccess } = require('../utils/apiResponse');
const { parsePagination, buildPaginationMeta } = require('../utils/pagination');

class PropertyController {
  async create(req, res, next) {
    try {
      const property = await propertyService.create(req.user.id, req.body);
      sendSuccess(res, 201, 'Property created', property);
    } catch (error) {
      next(error);
    }
  }

  async getAll(req, res, next) {
    try {
      const { page, limit, skip } = parsePagination(req.query);
      const { status, type, city, verified } = req.query;
      
      // Default to ACTIVE for public searches unless an authorized admin/owner explicitly requests otherwise
      // For simplicity, we force ACTIVE for the public search endpoint to prevent PENDING properties from showing up.
      const searchStatus = status || 'ACTIVE';

      const { properties, total } = await propertyService.getAll({ page, limit, skip, status: searchStatus, type, city, verified });
      sendSuccess(res, 200, 'Properties', properties, buildPaginationMeta(total, page, limit));
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const property = await propertyService.getById(req.params.id);
      sendSuccess(res, 200, 'Property details', property);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const property = await propertyService.update(req.params.id, req.user.id, req.body);
      sendSuccess(res, 200, 'Property updated', property);
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await propertyService.delete(req.params.id, req.user.id);
      sendSuccess(res, 200, 'Property deleted');
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req, res, next) {
    try {
      const property = await propertyService.updateStatus(req.params.id, req.body.status);
      sendSuccess(res, 200, 'Status updated', property);
    } catch (error) {
      next(error);
    }
  }

  async addImages(req, res, next) {
    try {
      const images = await propertyService.addImages(req.params.id, req.user.id, req.files);
      sendSuccess(res, 201, 'Images uploaded', images);
    } catch (error) {
      next(error);
    }
  }

  async removeImage(req, res, next) {
    try {
      await propertyService.removeImage(req.params.id, req.params.imageId, req.user.id);
      sendSuccess(res, 200, 'Image removed');
    } catch (error) {
      next(error);
    }
  }

  async getFeatured(req, res, next) {
    try {
      const properties = await propertyService.getFeatured();
      sendSuccess(res, 200, 'Featured properties', properties);
    } catch (error) {
      next(error);
    }
  }

  async getCategories(req, res, next) {
    try {
      const categories = await propertyService.getCategories();
      sendSuccess(res, 200, 'Property categories', categories);
    } catch (error) {
      next(error);
    }
  }

  // ── Room sub-resource ──────────────────────────────────
  async createRoom(req, res, next) {
    try {
      const prisma = require('../config/database');
      const ApiError = require('../utils/apiError');

      const property = await prisma.property.findUnique({ where: { id: req.params.propertyId } });
      if (!property) throw ApiError.notFound('Property not found');
      if (property.ownerId !== req.user.id) throw ApiError.forbidden('Not authorized');

      const room = await prisma.room.create({
        data: { ...req.body, propertyId: req.params.propertyId },
      });
      sendSuccess(res, 201, 'Room created', room);
    } catch (error) {
      next(error);
    }
  }

  async getRooms(req, res, next) {
    try {
      const prisma = require('../config/database');
      const rooms = await prisma.room.findMany({
        where: { propertyId: req.params.propertyId },
        orderBy: { pricePerMonth: 'asc' },
      });
      sendSuccess(res, 200, 'Rooms', rooms);
    } catch (error) {
      next(error);
    }
  }

  async updateRoom(req, res, next) {
    try {
      const prisma = require('../config/database');
      const ApiError = require('../utils/apiError');

      const room = await prisma.room.findUnique({
        where: { id: req.params.roomId },
        include: { property: { select: { ownerId: true } } },
      });
      if (!room) throw ApiError.notFound('Room not found');
      if (room.property.ownerId !== req.user.id) throw ApiError.forbidden('Not authorized');

      const updated = await prisma.room.update({
        where: { id: req.params.roomId },
        data: req.body,
      });
      sendSuccess(res, 200, 'Room updated', updated);
    } catch (error) {
      next(error);
    }
  }

  async deleteRoom(req, res, next) {
    try {
      const prisma = require('../config/database');
      const ApiError = require('../utils/apiError');

      const room = await prisma.room.findUnique({
        where: { id: req.params.roomId },
        include: { property: { select: { ownerId: true } } },
      });
      if (!room) throw ApiError.notFound('Room not found');
      if (room.property.ownerId !== req.user.id) throw ApiError.forbidden('Not authorized');

      await prisma.room.delete({ where: { id: req.params.roomId } });
      sendSuccess(res, 200, 'Room deleted');
    } catch (error) {
      next(error);
    }
  }

  async updateRoomAvailability(req, res, next) {
    try {
      const prisma = require('../config/database');
      const ApiError = require('../utils/apiError');

      const room = await prisma.room.findUnique({
        where: { id: req.params.roomId },
        include: { property: { select: { ownerId: true } } },
      });
      if (!room) throw ApiError.notFound('Room not found');
      if (room.property.ownerId !== req.user.id) throw ApiError.forbidden('Not authorized');

      const updated = await prisma.room.update({
        where: { id: req.params.roomId },
        data: { availableBeds: req.body.availableBeds },
      });
      sendSuccess(res, 200, 'Availability updated', updated);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PropertyController();
