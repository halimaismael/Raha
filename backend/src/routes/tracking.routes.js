const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/tracking.controller');

// Le suivi en temps réel se fait par Socket.io (src/sockets/tracking.socket.js) ;
// cette route REST ne sert qu'à récupérer la dernière position connue au
// chargement de l'écran, avant que les mises à jour temps réel n'arrivent.
router.get('/:tripId/last', ctrl.getLastLocation);

module.exports = router;
