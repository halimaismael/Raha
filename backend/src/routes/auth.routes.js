const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/auth.controller');

// Usagers (mobile)
router.post('/users/register', ctrl.registerUser);
router.post('/users/login', ctrl.loginUser);

// Agences (plateforme admin)
router.post('/agencies/register', ctrl.registerAgency);
router.post('/agencies/login', ctrl.loginAgencyAdmin);

// Chauffeurs indépendants (mobile — espace "Je suis un professionnel")
router.post('/independent-drivers/register', ctrl.registerIndependentDriver);
router.post('/independent-drivers/login', ctrl.loginIndependentDriver);

// Chauffeurs d'agence (mobile — une fois leur compte activé par l'agence)
router.post('/drivers/login', ctrl.loginDriver);

module.exports = router;
