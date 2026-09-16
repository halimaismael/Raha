const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/vehicle.controller');
const { requireAuth } = require('../middleware/auth');

const PROFESSIONAL_ROLES = ['AGENCY_ADMIN', 'INDEPENDENT_DRIVER'];

router.get('/search', ctrl.searchVehicles);
router.get('/rental-search', ctrl.searchRentalVehicles);
router.get('/mine', requireAuth(PROFESSIONAL_ROLES), ctrl.listMyVehicles);
router.post('/', requireAuth(PROFESSIONAL_ROLES), ctrl.createVehicle);
router.patch('/rental-periods/:periodId', requireAuth(PROFESSIONAL_ROLES), ctrl.updateRentalPeriod);
router.delete('/rental-periods/:periodId', requireAuth(PROFESSIONAL_ROLES), ctrl.deleteRentalPeriod);
router.post('/:id/rental-periods', requireAuth(PROFESSIONAL_ROLES), ctrl.createRentalPeriod);
router.get('/:id/rental-periods', requireAuth(PROFESSIONAL_ROLES), ctrl.listRentalPeriods);
router.patch('/:id', requireAuth(PROFESSIONAL_ROLES), ctrl.updateVehicle);
router.patch('/:id/location', requireAuth(PROFESSIONAL_ROLES), ctrl.updateVehicleLocation);
router.delete('/:id', requireAuth(PROFESSIONAL_ROLES), ctrl.deleteVehicle);
router.get('/:id', ctrl.getVehicle);

module.exports = router;
