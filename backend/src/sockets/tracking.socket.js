// Gestion Socket.io pour le suivi temps réel des trajets (façon Uber)
//
// Événements client -> serveur :
//   - "join:trip"   { tripId }   -> un usager rejoint la room pour suivre un trajet
//   - "leave:trip"  { tripId }
//   - "driver:location" { tripId, lat, lng, heading, speedKmh } -> le chauffeur/agence publie sa position
//   - "join:agency" { agencyId } -> le tableau de bord d'une agence/d'un particulier rejoint sa room
//     pour recevoir "booking:new" et "booking:updated" en temps réel
//
// Événements serveur -> client :
//   - "location:update" { lat, lng, heading, speedKmh, createdAt } -> diffusé à tous les usagers de la room
//   - "booking:new" / "booking:updated" { ...booking } -> diffusé à l'agence concernée

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

    socket.on('join:agency', ({ agencyId }) => {
      if (!agencyId) return;
      socket.join(`agency:${agencyId}`);
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
