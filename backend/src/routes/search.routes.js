// ─────────────────────────────────────────────────────────────
// Routes — Search
// ─────────────────────────────────────────────────────────────

const { Router } = require('express');
const searchController = require('../controllers/search.controller');
const { optionalAuth } = require('../middlewares/auth.middleware');

const router = Router();

router.get('/properties', optionalAuth, searchController.searchProperties);
router.get('/map-pins', optionalAuth, searchController.searchProperties); // alias
router.get('/filters/options', searchController.getFilterOptions);

module.exports = router;
