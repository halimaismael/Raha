// Gestion Socket.io pour le suivi temps réel des trajets (façon Uber) et la
// synchronisation des réservations entre usager, agence et chauffeurs.
//
// Événements client -> serveur :
//   - "join:trip"        { tripId }   -> un usager rejoint la room pour suivre un trajet
//   - "leave:trip"       { tripId }
//   - "join:user"        { userId }         -> l'app usager rejoint sa propre room
//   - "join:agency"      { agencyId }       -> le tableau de bord d'une agence rejoint sa room
//   - "join:driver"      { driverId }       -> l'app d'un chauffeur d'agence rejoint sa room
//   - "join:independent" { independentDriverId } -> l'app d'un chauffeur indépendant rejoint sa room
//   - "driver:location"  { tripId, lat, lng, heading, speedKmh } -> le chauffeur/agence publie sa position
//
// Événements serveur -> client (voir utils/notify.util.js) :
//   - "location:update"    { lat, lng, heading, speedKmh, createdAt } -> diffusé à tous les usagers de la room trajet
//   - "notification:new"   { ...notification } -> diffusé au destinataire concerné
//   - "booking:new" / "booking:updated" { ...booking } -> diffusé à toutes les parties concernées par la réservation

function registerTrackingSocket(io, prisma) {
  io.on('connection', (socket) => {
    socket.on('join:trip', ({ tripId }) => {
      if (!tripId) return;
      socket.join(`trip:${tripId}`);
    });

    socket.on('leave:trip', ({ tripId }) => {
      if (!tripId) return;
      socket.leave(`trip:${tripId}`);
    });

    socket.on('join:user', ({ userId }) => {
      if (!userId) return;
      socket.join(`user:${userId}`);
    });

    socket.on('join:agency', ({ agencyId }) => {
      if (!agencyId) return;
      socket.join(`agency:${agencyId}`);
    });

    socket.on('join:driver', ({ driverId }) => {
      if (!driverId) return;
      socket.join(`driver:${driverId}`);
    });

    socket.on('join:independent', ({ independentDriverId }) => {
      if (!independentDriverId) return;
      socket.join(`independent:${independentDriverId}`);
    });

    socket.on('driver:location', async ({ tripId, lat, lng, heading, speedKmh }) => {
      if (!tripId || lat == null || lng == null) return;
      try {
        const ping = await prisma.locationPing.create({
          data: { tripId, lat, lng, heading, speedKmh },
        });
        io.to(`trip:${tripId}`).emit('location:update', ping);
      } catch (err) {
        console.error('Erreur enregistrement position GPS:', err.message);
      }
    });

    socket.on('disconnect', () => {
      // rien à nettoyer explicitement, socket.io retire des rooms automatiquement
    });
  });
}

module.exports = { registerTrackingSocket };
