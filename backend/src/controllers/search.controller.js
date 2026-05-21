// ─────────────────────────────────────────────────────────────
// Controller — Search
// ─────────────────────────────────────────────────────────────

const searchService = require('../services/search.service');
const { sendSuccess } = require('../utils/apiResponse');

class SearchController {
  async searchProperties(req, res, next) {
    try {
      const result = await searchService.searchProperties(req.query);
      sendSuccess(res, 200, 'Search results', result);
    } catch (error) {
      next(error);
    }
  }

  async getFilterOptions(req, res, next) {
    try {
      const options = await searchService.getFilterOptions();
      sendSuccess(res, 200, 'Filter options', options);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SearchController();
