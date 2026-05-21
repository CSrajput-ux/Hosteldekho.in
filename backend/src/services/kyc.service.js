// ─────────────────────────────────────────────────────────────
// Service — KYC
// Owner KYC document management
// ─────────────────────────────────────────────────────────────

const prisma = require('../config/database');
const ApiError = require('../utils/apiError');
const uploadService = require('./upload.service');
const logger = require('../utils/logger');

class KycService {
  /**
   * Mask Aadhaar number (store only last 4 digits)
   */
  maskAadhaar(aadhaarNumber) {
    return `XXXX-XXXX-${aadhaarNumber.slice(-4)}`;
  }

  /**
   * Mask PAN number
   */
  maskPan(panNumber) {
    return `${panNumber.slice(0, 2)}XXXXX${panNumber.slice(-2)}`;
  }

  /**
   * Submit Aadhaar KYC
   */
  async submitAadhaar(ownerId, aadhaarNumber, selfieFile) {
    const masked = this.maskAadhaar(aadhaarNumber);

    let selfieUrl = null;
    if (selfieFile) {
      const result = await uploadService.uploadImage(selfieFile.path, 'hosteldekho/kyc');
      selfieUrl = result.secure_url;
    }

    const kyc = await prisma.kyc.upsert({
      where: { id: await this.getKycIdOrCreate(ownerId) },
      create: {
        ownerId,
        aadhaarMasked: masked,
        selfieUrl,
        status: 'UNDER_REVIEW',
      },
      update: {
        aadhaarMasked: masked,
        selfieUrl,
        status: 'UNDER_REVIEW',
      },
    });

    logger.info(`KYC Aadhaar submitted for owner: ${ownerId}`);
    return kyc;
  }

  /**
   * Submit PAN KYC
   */
  async submitPan(ownerId, panNumber) {
    const masked = this.maskPan(panNumber);

    const kyc = await prisma.kyc.upsert({
      where: { id: await this.getKycIdOrCreate(ownerId) },
      create: {
        ownerId,
        panMasked: masked,
        status: 'UNDER_REVIEW',
      },
      update: {
        panMasked: masked,
        status: 'UNDER_REVIEW',
      },
    });

    return kyc;
  }

  /**
   * Submit property proof document
   */
  async submitPropertyProof(ownerId, proofFile) {
    if (!proofFile) throw ApiError.badRequest('Property proof document is required');

    const result = await uploadService.uploadImage(proofFile.path, 'hosteldekho/kyc');

    const kyc = await prisma.kyc.upsert({
      where: { id: await this.getKycIdOrCreate(ownerId) },
      create: {
        ownerId,
        propertyProofUrl: result.secure_url,
        status: 'UNDER_REVIEW',
      },
      update: {
        propertyProofUrl: result.secure_url,
        status: 'UNDER_REVIEW',
      },
    });

    return kyc;
  }

  /**
   * Get KYC status for an owner
   */
  async getStatus(ownerId) {
    const kyc = await prisma.kyc.findFirst({
      where: { ownerId },
      orderBy: { createdAt: 'desc' },
    });

    if (!kyc) {
      return { status: 'NOT_STARTED', steps: { aadhaar: false, pan: false, propertyProof: false, selfie: false } };
    }

    return {
      id: kyc.id,
      status: kyc.status,
      rejectionReason: kyc.rejectionReason,
      verifiedAt: kyc.verifiedAt,
      steps: {
        aadhaar: !!kyc.aadhaarMasked,
        pan: !!kyc.panMasked,
        propertyProof: !!kyc.propertyProofUrl,
        selfie: !!kyc.selfieUrl,
      },
    };
  }

  /**
   * Approve KYC (admin)
   */
  async approve(kycId) {
    const kyc = await prisma.kyc.findUnique({ where: { id: kycId } });
    if (!kyc) throw ApiError.notFound('KYC record not found');

    await prisma.$transaction([
      prisma.kyc.update({
        where: { id: kycId },
        data: { status: 'APPROVED', verifiedAt: new Date() },
      }),
      // Also verify all owner's properties
      prisma.property.updateMany({
        where: { ownerId: kyc.ownerId },
        data: { verified: true },
      }),
    ]);

    return { message: 'KYC approved' };
  }

  /**
   * Reject KYC (admin)
   */
  async reject(kycId, rejectionReason) {
    const kyc = await prisma.kyc.findUnique({ where: { id: kycId } });
    if (!kyc) throw ApiError.notFound('KYC record not found');

    return prisma.kyc.update({
      where: { id: kycId },
      data: { status: 'REJECTED', rejectionReason },
    });
  }

  /**
   * Helper: get existing KYC ID or create a new record
   */
  async getKycIdOrCreate(ownerId) {
    const existing = await prisma.kyc.findFirst({
      where: { ownerId },
      orderBy: { createdAt: 'desc' },
    });

    if (existing) return existing.id;

    const newKyc = await prisma.kyc.create({
      data: { ownerId, status: 'PENDING' },
    });

    return newKyc.id;
  }
}

module.exports = new KycService();
