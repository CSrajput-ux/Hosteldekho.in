// ─────────────────────────────────────────────────────────────
// Service — File Upload (Cloudinary)
// ─────────────────────────────────────────────────────────────

const cloudinary = require('../config/cloudinary');
const fs = require('fs');
const logger = require('../utils/logger');
const ApiError = require('../utils/apiError');

class UploadService {
  /**
   * Upload image to Cloudinary
   * @param {string} filePath - Local file path
   * @param {string} folder   - Cloudinary folder
   * @returns {Promise<object>}
   */
  async uploadImage(filePath, folder = 'hosteldekho') {
    try {
      const result = await cloudinary.uploader.upload(filePath, {
        folder,
        resource_type: 'image',
        transformation: [
          { width: 1200, height: 900, crop: 'limit' },
          { quality: 'auto:good' },
          { fetch_format: 'auto' },
        ],
      });

      // Clean up local file after upload
      fs.unlink(filePath, (err) => {
        if (err) logger.warn(`Failed to delete local file: ${filePath}`);
      });

      return result;
    } catch (error) {
      // Clean up on failure too
      fs.unlink(filePath, () => {});
      logger.error('Cloudinary upload failed:', error.message);
      throw ApiError.internal('Image upload failed');
    }
  }

  /**
   * Upload multiple images
   * @param {string[]} filePaths
   * @param {string} folder
   * @returns {Promise<object[]>}
   */
  async uploadMultiple(filePaths, folder = 'hosteldekho') {
    return Promise.all(filePaths.map((fp) => this.uploadImage(fp, folder)));
  }

  /**
   * Delete image from Cloudinary
   * @param {string} publicId
   */
  async deleteImage(publicId) {
    try {
      await cloudinary.uploader.destroy(publicId);
      logger.info(`Deleted image: ${publicId}`);
    } catch (error) {
      logger.error('Cloudinary delete failed:', error.message);
    }
  }
}

module.exports = new UploadService();
