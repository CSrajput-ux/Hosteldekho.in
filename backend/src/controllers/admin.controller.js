// ─────────────────────────────────────────────────────────────
// Controller — Admin
// Moderation tools for platform management
// ─────────────────────────────────────────────────────────────

const prisma = require('../config/database');
const kycService = require('../services/kyc.service');
const emailService = require('../services/email.service');
const { sendSuccess } = require('../utils/apiResponse');
const { parsePagination, buildPaginationMeta } = require('../utils/pagination');

const MASTER_EMAIL = 'chhotu415@gmail.com';

class AdminController {
  // ── KYC Management ────────────────────────────────────
  async getPendingKyc(req, res, next) {
    try {
      const { page, limit, skip } = parsePagination(req.query);
      const [records, total] = await Promise.all([
        prisma.kyc.findMany({
          where: { status: { in: ['PENDING', 'UNDER_REVIEW'] } },
          skip,
          take: limit,
          orderBy: { createdAt: 'asc' },
          include: { owner: { select: { id: true, name: true, mobile: true, email: true } } },
        }),
        prisma.kyc.count({ where: { status: { in: ['PENDING', 'UNDER_REVIEW'] } } }),
      ]);
      sendSuccess(res, 200, 'Pending KYC records', records, buildPaginationMeta(total, page, limit));
    } catch (error) {
      next(error);
    }
  }

  async approveKyc(req, res, next) {
    if (req.user.email !== MASTER_EMAIL) {
      return res.status(403).json({ success: false, message: 'Extreme Security: Master Admin only.' });
    }
    try {
      const result = await kycService.approve(req.params.id);
      
      // Audit & Email
      await prisma.auditLog.create({
        data: {
          adminId: req.user.id,
          action: 'APPROVE_KYC',
          targetId: req.params.id,
          entity: 'KYC',
          details: `KYC for owner ${result.ownerId} approved.`
        }
      });

      const owner = await prisma.user.findUnique({ where: { id: result.ownerId } });
      if (owner) await emailService.notifyKycStatus(owner, result, 'APPROVED');

      sendSuccess(res, 200, 'KYC approved', result);
    } catch (error) {
      next(error);
    }
  }

  async rejectKyc(req, res, next) {
    if (req.user.email !== MASTER_EMAIL) {
      return res.status(403).json({ success: false, message: 'Extreme Security: Master Admin only.' });
    }
    try {
      const result = await kycService.reject(req.params.id, req.body.rejectionReason);

      // Audit & Email
      await prisma.auditLog.create({
        data: {
          adminId: req.user.id,
          action: 'REJECT_KYC',
          targetId: req.params.id,
          entity: 'KYC',
          details: `KYC for owner ${result.ownerId} rejected. Reason: ${req.body.rejectionReason}`
        }
      });

      const owner = await prisma.user.findUnique({ where: { id: result.ownerId } });
      if (owner) await emailService.notifyKycStatus(owner, result, 'REJECTED');

      sendSuccess(res, 200, 'KYC rejected', result);
    } catch (error) {
      next(error);
    }
  }

  // ── Property Moderation ───────────────────────────────
  async getPendingProperties(req, res, next) {
    try {
      const { page, limit, skip } = parsePagination(req.query);
      const [properties, total] = await Promise.all([
        prisma.property.findMany({
          where: { status: 'PENDING' },
          skip,
          take: limit,
          orderBy: { createdAt: 'asc' },
          include: {
            owner: { select: { id: true, name: true, mobile: true } },
            images: { take: 3 },
          },
        }),
        prisma.property.count({ where: { status: 'PENDING' } }),
      ]);
      sendSuccess(res, 200, 'Pending properties', properties, buildPaginationMeta(total, page, limit));
    } catch (error) {
      next(error);
    }
  }

  async approveProperty(req, res, next) {
    if (req.user.email !== MASTER_EMAIL) {
      return res.status(403).json({ success: false, message: 'Extreme Security: Master Admin only.' });
    }
    try {
      const property = await prisma.property.update({
        where: { id: req.params.id },
        data: { status: 'ACTIVE' },
        include: { owner: true }
      });

      // Audit & Email
      await prisma.auditLog.create({
        data: {
          adminId: req.user.id,
          action: 'APPROVE_PROPERTY',
          targetId: req.params.id,
          entity: 'Property',
          details: `Property '${property.title}' approved.`
        }
      });

      if (property.owner) await emailService.notifyPropertyStatus(property.owner, property, 'ACTIVE');

      sendSuccess(res, 200, 'Property approved', property);
    } catch (error) {
      next(error);
    }
  }

  async rejectProperty(req, res, next) {
    if (req.user.email !== MASTER_EMAIL) {
      return res.status(403).json({ success: false, message: 'Extreme Security: Master Admin only.' });
    }
    try {
      const property = await prisma.property.update({
        where: { id: req.params.id },
        data: { status: 'REJECTED' },
        include: { owner: true }
      });

      // Audit & Email
      await prisma.auditLog.create({
        data: {
          adminId: req.user.id,
          action: 'REJECT_PROPERTY',
          targetId: req.params.id,
          entity: 'Property',
          details: `Property '${property.title}' rejected.`
        }
      });

      if (property.owner) await emailService.notifyPropertyStatus(property.owner, property, 'REJECTED');

      sendSuccess(res, 200, 'Property rejected', property);
    } catch (error) {
      next(error);
    }
  }

  // ── User Management ───────────────────────────────────
  async getUsers(req, res, next) {
    try {
      const { page, limit, skip } = parsePagination(req.query);
      const { role } = req.query;
      const where = role ? { role } : {};

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true, name: true, email: true, mobile: true, role: true,
            isActive: true, createdAt: true, lastLoginAt: true,
            _count: { select: { bookings: true, properties: true, reviews: true } },
          },
        }),
        prisma.user.count({ where }),
      ]);
      sendSuccess(res, 200, 'Users', users, buildPaginationMeta(total, page, limit));
    } catch (error) {
      next(error);
    }
  }

  async blockUser(req, res, next) {
    if (req.user.email !== MASTER_EMAIL) return res.status(403).json({ success: false, message: 'Forbidden' });
    try {
      const updated = await prisma.user.update({
        where: { id: req.params.id },
        data: { isActive: false },
        select: { id: true, name: true, isActive: true },
      });
      await prisma.auditLog.create({
        data: { adminId: req.user.id, action: 'BLOCK_USER', targetId: req.params.id, entity: 'User', details: `User ${updated.name} blocked.` }
      });
      sendSuccess(res, 200, 'User blocked', updated);
    } catch (error) { next(error); }
  }

  async activateUser(req, res, next) {
    if (req.user.email !== MASTER_EMAIL) return res.status(403).json({ success: false, message: 'Forbidden' });
    try {
      const updated = await prisma.user.update({
        where: { id: req.params.id },
        data: { isActive: true },
        select: { id: true, name: true, isActive: true },
      });
      await prisma.auditLog.create({
        data: { adminId: req.user.id, action: 'ACTIVATE_USER', targetId: req.params.id, entity: 'User', details: `User ${updated.name} activated.` }
      });
      sendSuccess(res, 200, 'User activated', updated);
    } catch (error) { next(error); }
  }

  async getAllProperties(req, res, next) {
    try {
      const { page, limit, skip } = parsePagination(req.query);
      const { status } = req.query;
      const where = status ? { status } : { status: { not: 'DELETED' } };
      const [properties, total] = await Promise.all([
        prisma.property.findMany({
          where, skip, take: limit,
          orderBy: { createdAt: 'desc' },
          include: { owner: { select: { id: true, name: true, email: true } } }
        }),
        prisma.property.count({ where })
      ]);
      sendSuccess(res, 200, 'Properties', properties, buildPaginationMeta(total, page, limit));
    } catch (error) { next(error); }
  }

  async togglePropertyFeature(req, res, next) {
    if (req.user.email !== MASTER_EMAIL) return res.status(403).json({ success: false, message: 'Forbidden' });
    try {
      const prop = await prisma.property.findUnique({ where: { id: req.params.id } });
      const updated = await prisma.property.update({
        where: { id: req.params.id },
        data: { isFeatured: !prop.isFeatured }
      });
      await prisma.auditLog.create({
        data: { adminId: req.user.id, action: 'TOGGLE_FEATURE', targetId: req.params.id, entity: 'Property', details: `Featured: ${updated.isFeatured}` }
      });
      sendSuccess(res, 200, 'Feature toggled', updated);
    } catch (error) { next(error); }
  }

  async togglePropertyStatus(req, res, next) {
    if (req.user.email !== MASTER_EMAIL) return res.status(403).json({ success: false, message: 'Forbidden' });
    try {
      const prop = await prisma.property.findUnique({ where: { id: req.params.id } });
      const newStatus = prop.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
      const updated = await prisma.property.update({
        where: { id: req.params.id },
        data: { status: newStatus }
      });
      await prisma.auditLog.create({
        data: { adminId: req.user.id, action: 'TOGGLE_PROPERTY_STATUS', targetId: req.params.id, entity: 'Property', details: `Status: ${newStatus}` }
      });
      sendSuccess(res, 200, 'Status toggled', updated);
    } catch (error) { next(error); }
  }

  // ── Platform Stats ────────────────────────────────────
  async getStats(req, res, next) {
    try {
      const [users, properties, pendingProps, bookings, revenue, activity] = await Promise.all([
        prisma.user.count(),
        prisma.property.count({ where: { status: 'ACTIVE' } }),
        prisma.property.count({ where: { status: 'PENDING' } }),
        prisma.booking.count({ where: { status: 'CONFIRMED' } }),
        prisma.payment.aggregate({ where: { status: 'CAPTURED' }, _sum: { amount: true } }),
        prisma.auditLog.findMany({ take: 10, orderBy: { createdAt: 'desc' }, include: { admin: { select: { name: true } } } })
      ]);

      sendSuccess(res, 200, 'Platform stats', {
        totalUsers: users,
        activeProperties: properties,
        pendingApprovals: pendingProps,
        confirmedBookings: bookings,
        totalRevenue: revenue._sum.amount || 0,
        recentActivity: activity
      });
    } catch (error) { next(error); }
  }

  async getSettings(req, res, next) {
    try {
      const configs = await prisma.systemConfig.findMany();
      sendSuccess(res, 200, 'System settings', configs);
    } catch (error) { next(error); }
  }

  async updateSettings(req, res, next) {
    if (req.user.email !== MASTER_EMAIL) return res.status(403).json({ success: false, message: 'Forbidden' });
    try {
      const { key, value, label, group } = req.body;
      const config = await prisma.systemConfig.upsert({
        where: { key },
        update: { value, label, group },
        create: { key, value, label, group }
      });
      await prisma.auditLog.create({
        data: { adminId: req.user.id, action: 'UPDATE_SETTING', targetId: key, entity: 'SystemConfig', details: `Setting '${key}' updated.` }
      });
      sendSuccess(res, 200, 'Setting updated', config);
    } catch (error) { next(error); }
  }
}

module.exports = new AdminController();
