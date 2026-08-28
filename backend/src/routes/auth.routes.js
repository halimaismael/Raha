const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/auth.controller');

// Usagers (mobile)
router.post('/users/register', ctrl.registerUser);
router.post('/users/login', ctrl.loginUser);

// Agences (plateforme admin)
router.post('/agencies/register', ctrl.registerAgency);
router.post('/agencies/login', ctrl.loginAgencyAdmin);

module.exports = router;
