const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/mwana.controller');
const { requireAuth } = require('../middleware/auth');

// Service Raha Mwana (accompagnement scolaire) — usager uniquement.
router.post('/', requireAuth(['USER']), ctrl.createMwanaRequest);
router.get('/mine', requireAuth(['USER']), ctrl.listMyMwanaRequests);

module.exports = router;
