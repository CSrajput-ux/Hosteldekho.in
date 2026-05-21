// ─────────────────────────────────────────────────────────────
// Controller — KYC
// ─────────────────────────────────────────────────────────────

const kycService = require('../services/kyc.service');
const { sendSuccess } = require('../utils/apiResponse');

class KycController {
  async submitAadhaar(req, res, next) {
    try {
      const selfieFile = req.files?.selfie?.[0] || null;
      const result = await kycService.submitAadhaar(req.user.id, req.body.aadhaarNumber, selfieFile);
      sendSuccess(res, 200, 'Aadhaar submitted', result);
    } catch (error) {
      next(error);
    }
  }

  async submitPan(req, res, next) {
    try {
      const result = await kycService.submitPan(req.user.id, req.body.panNumber);
      sendSuccess(res, 200, 'PAN submitted', result);
    } catch (error) {
      next(error);
    }
  }

  async submitPropertyProof(req, res, next) {
    try {
      const proofFile = req.files?.propertyProof?.[0] || req.file || null;
      const result = await kycService.submitPropertyProof(req.user.id, proofFile);
      sendSuccess(res, 200, 'Property proof submitted', result);
    } catch (error) {
      next(error);
    }
  }

  async getStatus(req, res, next) {
    try {
      const status = await kycService.getStatus(req.user.id);
      sendSuccess(res, 200, 'KYC status', status);
    } catch (error) {
      next(error);
    }
  }

  async approve(req, res, next) {
    try {
      const result = await kycService.approve(req.params.id);
      sendSuccess(res, 200, 'KYC approved', result);
    } catch (error) {
      next(error);
    }
  }

  async reject(req, res, next) {
    try {
      const result = await kycService.reject(req.params.id, req.body.rejectionReason);
      sendSuccess(res, 200, 'KYC rejected', result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new KycController();
