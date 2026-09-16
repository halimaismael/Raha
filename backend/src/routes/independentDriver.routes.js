const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/independentDriver.controller');
const { requireAuth } = require('../middleware/auth');

// Espace du chauffeur indépendant lui-même — routes statiques "/me..."
// déclarées AVANT "/:id" pour ne jamais être interceptées par le paramètre.
router.get('/me', requireAuth(['INDEPENDENT_DRIVER']), ctrl.getMe);
router.patch('/me', requireAuth(['INDEPENDENT_DRIVER']), ctrl.updateMe);

router.get('/me/pricing', requireAuth(['INDEPENDENT_DRIVER']), ctrl.listMyPricing);
router.post('/me/pricing', requireAuth(['INDEPENDENT_DRIVER']), ctrl.createPricing);
router.patch('/me/pricing/:id', requireAuth(['INDEPENDENT_DRIVER']), ctrl.updatePricing);
router.delete('/me/pricing/:id', requireAuth(['INDEPENDENT_DRIVER']), ctrl.deletePricing);

router.get('/me/availability', requireAuth(['INDEPENDENT_DRIVER']), ctrl.listMyAvailability);
router.put('/me/availability', requireAuth(['INDEPENDENT_DRIVER']), ctrl.setMyAvailability);

// Validation par l'équipe Raha (clé secrète — voir le contrôleur). Placées
// avant "/:id" par cohérence, même si ces chemins plus longs/spécifiques ne
// seraient de toute façon jamais interceptés par "/:id".
router.get('/ops-key-check', ctrl.opsKeyDebug);
router.get('/pending', ctrl.listPending);
router.patch('/validate-by-phone', ctrl.validateDriverByPhone);
router.patch('/:id/validate', ctrl.validateDriver);
router.delete('/:id/reject', ctrl.rejectDriver);

// Annuaire public (app mobile côté usager)
router.get('/', ctrl.listIndependentDrivers);
router.get('/:id', ctrl.getPublicProfile);

module.exports = router;
