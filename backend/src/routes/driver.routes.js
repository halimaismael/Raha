const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/driver.controller');
const { requireAuth } = require('../middleware/auth');

router.get('/mine', requireAuth(['AGENCY_ADMIN']), ctrl.listMyDrivers);
router.post('/', requireAuth(['AGENCY_ADMIN']), ctrl.createDriver);
router.patch('/:id', requireAuth(['AGENCY_ADMIN']), ctrl.updateDriver);
router.delete('/:id', requireAuth(['AGENCY_ADMIN']), ctrl.deleteDriver);

module.exports = router;
