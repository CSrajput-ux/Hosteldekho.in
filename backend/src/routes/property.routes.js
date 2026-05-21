// ─────────────────────────────────────────────────────────────
// Routes — Property + Room
// ─────────────────────────────────────────────────────────────

const { Router } = require('express');
const propertyController = require('../controllers/property.controller');
const { authenticate, optionalAuth } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { uploadPropertyImages } = require('../middlewares/upload.middleware');
const {
  createPropertySchema, updatePropertySchema,
  updatePropertyStatusSchema, createRoomSchema, updateRoomSchema,
} = require('../validators/property.validator');

const router = Router();

// ── Public routes ────────────────────────────────────────
router.get('/featured', propertyController.getFeatured);
router.get('/categories', propertyController.getCategories);
router.get('/', optionalAuth, propertyController.getAll);
router.get('/:id', optionalAuth, propertyController.getById);
router.get('/:propertyId/rooms', propertyController.getRooms);

// ── Protected routes (OWNER / ADMIN) ────────────────────
router.post('/', authenticate, authorize('USER', 'OWNER', 'ADMIN'), validate(createPropertySchema), propertyController.create);
router.put('/:id', authenticate, authorize('OWNER', 'ADMIN'), validate(updatePropertySchema), propertyController.update);
router.delete('/:id', authenticate, authorize('OWNER', 'ADMIN'), propertyController.delete);
router.patch('/:id/status', authenticate, authorize('ADMIN'), validate(updatePropertyStatusSchema), propertyController.updateStatus);

// ── Images ──────────────────────────────────────────────
router.post('/:id/images', authenticate, authorize('OWNER', 'ADMIN'), uploadPropertyImages, propertyController.addImages);
router.delete('/:id/images/:imageId', authenticate, authorize('OWNER', 'ADMIN'), propertyController.removeImage);

// ── Rooms ───────────────────────────────────────────────
router.post('/:propertyId/rooms', authenticate, authorize('OWNER', 'ADMIN'), validate(createRoomSchema), propertyController.createRoom);
router.put('/rooms/:roomId', authenticate, authorize('OWNER', 'ADMIN'), validate(updateRoomSchema), propertyController.updateRoom);
router.delete('/rooms/:roomId', authenticate, authorize('OWNER', 'ADMIN'), propertyController.deleteRoom);
router.patch('/rooms/:roomId/availability', authenticate, authorize('OWNER', 'ADMIN'), propertyController.updateRoomAvailability);

module.exports = router;
