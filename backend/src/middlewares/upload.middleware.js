// ─────────────────────────────────────────────────────────────
// Middleware — File Upload (Multer)
// Configures multer for property images and KYC documents
// ─────────────────────────────────────────────────────────────

const multer = require('multer');
const path = require('path');
const ApiError = require('../utils/apiError');

// ── Storage ──────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.resolve(__dirname, '../../uploads'));
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

// ── File filter ──────────────────────────────────────────────
const imageFilter = (_req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ApiError(400, 'Only JPEG, PNG, WebP, and AVIF images are allowed'), false);
  }
};

const documentFilter = (_req, file, cb) => {
  const allowedMimes = [
    'image/jpeg', 'image/png', 'image/webp',
    'application/pdf',
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ApiError(400, 'Only JPEG, PNG, WebP, and PDF files are allowed'), false);
  }
};

// ── Upload instances ─────────────────────────────────────────

/** Property images — max 10, 5 MB each */
const uploadPropertyImages = multer({
  storage,
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 10 },
}).array('images', 10);

/** Single image upload (profile, etc.) — max 2 MB */
const uploadSingleImage = multer({
  storage,
  fileFilter: imageFilter,
  limits: { fileSize: 2 * 1024 * 1024 },
}).single('image');

/** KYC documents — max 3, 5 MB each */
const uploadKycDocuments = multer({
  storage,
  fileFilter: documentFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 3 },
}).fields([
  { name: 'aadhaar', maxCount: 1 },
  { name: 'pan', maxCount: 1 },
  { name: 'propertyProof', maxCount: 1 },
  { name: 'selfie', maxCount: 1 },
]);

module.exports = {
  uploadPropertyImages,
  uploadSingleImage,
  uploadKycDocuments,
};
