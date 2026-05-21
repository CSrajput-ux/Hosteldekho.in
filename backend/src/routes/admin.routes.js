// ─────────────────────────────────────────────────────────────
// Routes — Admin
// ─────────────────────────────────────────────────────────────

const { Router } = require('express');
const adminController = require('../controllers/admin.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');

const router = Router();

router.use(authenticate, authorize('ADMIN'));

// KYC Moderation
router.get('/kyc/pending', adminController.getPendingKyc);
router.patch('/kyc/:id/approve', adminController.approveKyc);
router.patch('/kyc/:id/reject', adminController.rejectKyc);

router.get('/properties/pending', adminController.getPendingProperties);
router.get('/properties', adminController.getAllProperties);
router.patch('/properties/:id/approve', adminController.approveProperty);
router.patch('/properties/:id/reject', adminController.rejectProperty);
router.patch('/properties/:id/toggle-feature', adminController.togglePropertyFeature);
router.patch('/properties/:id/toggle-status', adminController.togglePropertyStatus);

// User Management
router.get('/users', adminController.getUsers);
router.patch('/users/:id/block', adminController.blockUser);
router.patch('/users/:id/activate', adminController.activateUser);

// Platform Stats & Settings
router.get('/stats', adminController.getStats);
router.get('/settings', adminController.getSettings);
router.patch('/settings', adminController.updateSettings);

module.exports = router;
