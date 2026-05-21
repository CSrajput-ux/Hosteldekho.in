// ─────────────────────────────────────────────────────────────
// Routes — Owner Dashboard
// ─────────────────────────────────────────────────────────────

const { Router } = require('express');
const ownerController = require('../controllers/owner.controller');
const propertyController = require('../controllers/property.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { createPropertySchema, updatePropertySchema } = require('../validators/property.validator');

const router = Router();

router.use(authenticate, authorize('OWNER', 'ADMIN'));

router.get('/dashboard', ownerController.getDashboard);
router.get('/properties', ownerController.getProperties);
router.post('/properties', validate(createPropertySchema), propertyController.create);
router.put('/properties/:id', validate(updatePropertySchema), propertyController.update);
router.delete('/properties/:id', propertyController.delete);
router.get('/bookings', ownerController.getBookings);
router.patch('/bookings/:id/status', ownerController.updateBookingStatus);
router.get('/earnings', ownerController.getEarnings);
router.get('/leads', ownerController.getLeads);

module.exports = router;
