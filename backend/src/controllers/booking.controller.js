const prisma = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const { sendSms } = require('../utils/sms.util');

function generateReference() {
  const year = new Date().getFullYear();
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `CM-${year}-${rand}`;
}

// POST /api/bookings  (usager - app mobile)
// bookingType: SHARED_SEAT | PRIVATE_FULL_DAY | CARGO_MOVING
async function createBooking(req, res, next) {
  try {
    const userId = req.auth.id;
    const {
      vehicleId, tripId, bookingType, scheduledDate,
      seatPreference, passengersCount,
      pickupName, pickupLat, pickupLng, dropoffName, dropoffLat, dropoffLng,
      purpose, notes, paymentMethod,
    } = req.body;

    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) return res.status(404).json({ message: "Véhicule introuvable" });

    let totalPrice = vehicle.basePrice;
    let seatNumber = null;
    let trip = null;

    if (bookingType === 'SHARED_SEAT') {
      if (!tripId) return res.status(400).json({ message: "tripId requis pour une place partagée" });
      trip = await prisma.trip.findUnique({ where: { id: tripId } });
      if (!trip) return res.status(404).json({ message: "Trajet introuvable" });
      if (trip.bookedSeats >= trip.totalSeats) {
        return res.status(409).json({ message: "Ce trajet est complet" });
      }
      totalPrice = trip.pricePerSeat * (passengersCount || 1);
      seatNumber = trip.bookedSeats + 1;
    } else if (bookingType === 'PRIVATE_FULL_DAY') {
      totalPrice = vehicle.basePrice; // prix journée complète
    } else if (bookingType === 'CARGO_MOVING') {
      totalPrice = vehicle.basePrice; // prix course camion (ajustable par l'agence après devis)
    } else {
      return res.status(400).json({ message: "bookingType invalide" });
    }

    const booking = await prisma.$transaction(async (tx) => {
      const created = await tx.booking.create({
        data: {
          reference: generateReference(),
          userId,
          agencyId: vehicle.agencyId,
          vehicleId,
          tripId: tripId || null,
          bookingType,
          scheduledDate: new Date(scheduledDate),
          seatNumber,
          seatPreference: seatPreference || 'PEU_IMPORTE',
          passengersCount: passengersCount || 1,
          pickupName, pickupLat, pickupLng, dropoffName, dropoffLat, dropoffLng,
          purpose, notes,
          totalPrice,
          paymentMethod: paymentMethod || 'CASH_ON_BOARD',
          paymentStatus: 'PENDING',
          status: 'PENDING',
        },
      });

      if (trip) {
        await tx.trip.update({
          where: { id: trip.id },
          data: { bookedSeats: { increment: passengersCount || 1 } },
        });
      }

      await tx.payment.create({
        data: {
          bookingId: created.id,
          amount: totalPrice,
          method: paymentMethod || 'CASH_ON_BOARD',
          status: 'PENDING',
        },
      });

      return created;
    });

    res.status(201).json(booking);

    // Diffusion temps réel vers le tableau de bord de l'agence/du particulier concerné,
    // notification en app pour l'usager, et tentative d'envoi SMS aux deux parties.
    try {
      const io = req.app.get('io');
      const full = await prisma.booking.findUnique({
        where: { id: booking.id },
        include: { user: true, vehicle: true, trip: true, payment: true, agency: true },
      });
      io.to(`agency:${vehicle.agencyId}`).emit('booking:new', full);

      await prisma.notification.create({
        data: {
          userId,
          title: 'Réservation confirmée',
          body: `Votre réservation ${booking.reference} auprès de ${full.agency.name} a bien été enregistrée.`,
        },
      });

      await sendSms(full.user.phone, `Comoro Move: réservation ${booking.reference} confirmée auprès de ${full.agency.name}.`);
      await sendSms(full.agency.phone, `Comoro Move: nouvelle réservation ${booking.reference} reçue de ${full.user.firstName} ${full.user.lastName} (${full.user.phone}).`);
    } catch (e) { /* la diffusion ne doit jamais faire échouer la réservation */ }
  } catch (err) { next(err); }
}

// GET /api/bookings/mine (usager)
async function listMyBookings(req, res, next) {
  try {
    const bookings = await prisma.booking.findMany({
      where: { userId: req.auth.id },
      include: { agency: true, vehicle: true, trip: true, payment: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(bookings);
  } catch (err) { next(err); }
}

// GET /api/bookings/:id
async function getBooking(req, res, next) {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: { agency: true, vehicle: { include: { drivers: true } }, trip: true, payment: true, user: true },
    });
    if (!booking) return res.status(404).json({ message: "Réservation introuvable" });
    // Sécurité : seul le propriétaire ou l'agence concernée peuvent voir la réservation
    if (req.auth.role === 'USER' && booking.userId !== req.auth.id) {
      return res.status(403).json({ message: "Accès refusé" });
    }
    if (req.auth.role === 'AGENCY_ADMIN' && booking.agencyId !== req.auth.agencyId) {
      return res.status(403).json({ message: "Accès refusé" });
    }
    res.json(booking);
  } catch (err) { next(err); }
}

// PATCH /api/bookings/:id/cancel (usager annule)
async function cancelBooking(req, res, next) {
  try {
    const booking = await prisma.booking.findUnique({ where: { id: req.params.id } });
    if (!booking || booking.userId !== req.auth.id) {
      return res.status(404).json({ message: "Réservation introuvable" });
    }
    if (['COMPLETED', 'CANCELLED'].includes(booking.status)) {
      return res.status(400).json({ message: "Impossible d'annuler cette réservation" });
    }
    const updated = await prisma.booking.update({
      where: { id: req.params.id },
      data: { status: 'CANCELLED' },
    });
    if (booking.tripId) {
      await prisma.trip.update({
        where: { id: booking.tripId },
        data: { bookedSeats: { decrement: booking.passengersCount } },
      });
    }
    try {
      req.app.get('io').to(`agency:${booking.agencyId}`).emit('booking:updated', updated);
    } catch (e) { /* ignore */ }
    res.json(updated);
  } catch (err) { next(err); }
}

// ---- Côté agence ----

// GET /api/bookings/agency/mine
async function listAgencyBookings(req, res, next) {
  try {
    const bookings = await prisma.booking.findMany({
      where: { agencyId: req.auth.agencyId },
      include: { user: true, vehicle: true, trip: true, payment: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(bookings);
  } catch (err) { next(err); }
}

// PATCH /api/bookings/:id/status  (agence: CONFIRMED / ONGOING / COMPLETED / CANCELLED)
async function updateBookingStatus(req, res, next) {
  try {
    const booking = await prisma.booking.findUnique({ where: { id: req.params.id } });
    if (!booking || booking.agencyId !== req.auth.agencyId) {
      return res.status(404).json({ message: "Réservation introuvable" });
    }
    const updated = await prisma.booking.update({
      where: { id: req.params.id },
      data: { status: req.body.status },
    });
    try {
      req.app.get('io').to(`agency:${booking.agencyId}`).emit('booking:updated', updated);
    } catch (e) { /* ignore */ }
    res.json(updated);
  } catch (err) { next(err); }
}

module.exports = {
  createBooking, listMyBookings, getBooking, cancelBooking,
  listAgencyBookings, updateBookingStatus,
};
