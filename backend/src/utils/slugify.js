// ─────────────────────────────────────────────────────────────
// Utils — URL-safe Slug Generator
// ─────────────────────────────────────────────────────────────

const slugifyLib = require('slugify');
const crypto = require('crypto');

/**
 * Create a URL-safe slug from a string
 * Appends a random suffix to ensure uniqueness
 *
 * @param {string} text - Input text (e.g. property title)
 * @returns {string}    - e.g. "nestline-coliving-a3b2c1"
 */
const createSlug = (text) => {
  const base = slugifyLib(text, {
    lower: true,
    strict: true,
    trim: true,
  });

  const suffix = crypto.randomBytes(3).toString('hex');
  return `${base}-${suffix}`;
};

module.exports = { createSlug };
