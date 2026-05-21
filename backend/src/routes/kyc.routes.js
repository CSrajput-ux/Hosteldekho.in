// ─────────────────────────────────────────────────────────────
// Routes — KYC
// ─────────────────────────────────────────────────────────────

const { Router } = require('express');
const kycController = require('../controllers/kyc.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');
const { uploadKycDocuments } = require('../middlewares/upload.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { submitAadhaarSchema, submitPanSchema, kycActionSchema } = require('../validators/kyc.validator');

const router = Router();

// Owner KYC submission
router.post('/aadhaar', authenticate, authorize('OWNER'), uploadKycDocuments, validate(submitAadhaarSchema), kycController.submitAadhaar);
router.post('/pan', authenticate, authorize('OWNER'), validate(submitPanSchema), kycController.submitPan);
router.post('/property-proof', authenticate, authorize('OWNER'), uploadKycDocuments, kycController.submitPropertyProof);
router.get('/status', authenticate, authorize('OWNER'), kycController.getStatus);

// Admin KYC actions
router.patch('/admin/:id/approve', authenticate, authorize('ADMIN'), kycController.approve);
router.patch('/admin/:id/reject', authenticate, authorize('ADMIN'), validate(kycActionSchema), kycController.reject);

module.exports = router;
