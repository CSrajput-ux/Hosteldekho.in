// ─────────────────────────────────────────────────────────────
// Utils — Pagination Helper
// ─────────────────────────────────────────────────────────────

/**
 * Parse and normalize pagination params from query string
 *
 * @param {object} query - Express req.query
 * @returns {{ page: number, limit: number, skip: number }}
 */
const parsePagination = (query) => {
  let page = parseInt(query.page, 10) || 1;
  let limit = parseInt(query.limit, 10) || 20;

  // Clamp
  page = Math.max(1, page);
  limit = Math.min(Math.max(1, limit), 100); // max 100 per page

  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

/**
 * Build pagination metadata for response
 *
 * @param {number} total - Total record count
 * @param {number} page  - Current page
 * @param {number} limit - Items per page
 * @returns {object}
 */
const buildPaginationMeta = (total, page, limit) => {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    hasNextPage: page * limit < total,
    hasPrevPage: page > 1,
  };
};

module.exports = { parsePagination, buildPaginationMeta };
