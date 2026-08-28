const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/vehicle.controller');
const { requireAuth } = require('../middleware/auth');

router.get('/search', ctrl.searchVehicles);
router.get('/mine', requireAuth(['AGENCY_ADMIN']), ctrl.listMyVehicles);
router.post('/', requireAuth(['AGENCY_ADMIN']), ctrl.createVehicle);
router.patch('/:id', requireAuth(['AGENCY_ADMIN']), ctrl.updateVehicle);
router.patch('/:id/location', requireAuth(['AGENCY_ADMIN']), ctrl.updateVehicleLocation);
router.delete('/:id', requireAuth(['AGENCY_ADMIN']), ctrl.deleteVehicle);
router.get('/:id', ctrl.getVehicle);

module.exports = router;
