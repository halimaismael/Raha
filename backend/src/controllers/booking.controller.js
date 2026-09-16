const prisma = require('../config/db');
const { nextBookingReference } = require('../utils/professionalCode.util');
const { findConflictingBooking } = require('../utils/availability.util');
const { notifyUser, notifyAgency, notifyDriver, notifyIndependentDriver, broadcastBookingUpdate } = require('../utils/notify.util');

const BOOKING_INCLUDE = {
  user: { select: { id: true, firstName: true, lastName: true, phone: true, avatarUrl: true } },
  agency: { select: { id: true, name: true, phone: true, logoUrl: true, professionalCode: true } },
  driver: { select: { id: true, name: true, phone: true, photoUrl: true, professionalCode: true, rating: true } },
  independentDriver: { select: { id: true, firstName: true, lastName: true, phone: true, photoUrl: true, professionalCode: true } },
  vehicle: true,
  trip: true,
  payment: true,
};

// Une fois la réservation confirmée (ou au-delà), l'usager et le
// professionnel doivent pouvoir s'appeler — avant, le numéro reste masqué.
const PHONE_VISIBLE_FROM = ['CONFIRMED', 'DRIVER_ASSIGNED', 'DRIVER_ARRIVING', 'DRIVER_ARRIVED', 'TRIP_STARTED', 'COMPLETED'];

function sanitizeBooking(booking) {
  if (!booking) return booking;
  if (PHONE_VISIBLE_FROM.includes(booking.status)) return booking;
  return {
    ...booking,
    user: booking.user ? { ...booking.user, phone: null } : booking.user,
    agency: booking.agency ? { ...booking.agency, phone: null } : booking.agency,
    driver: booking.driver ? { ...booking.driver, phone: null } : booking.driver,
    independentDriver: booking.independentDriver ? { ...booking.independentDriver, phone: null } : booking.independentDriver,
  };
}

async function recordStatusEvent(bookingId, status, note) {
  await prisma.bookingStatusEvent.create({ data: { bookingId, status, note: note || null } });
}

function daysBetweenInclusive(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const ms = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate())
    - Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  return Math.round(ms / 86400000) + 1;
}

// POST /api/bookings  (usager - app mobile)
// Le véhicule choisi détermine automatiquement s'il s'agit d'une réservation
// "agence" ou "chauffeur indépendant" — l'usager n'a rien à préciser de plus.
async function createBooking(req, res, next) {
  try {
    const userId = req.auth.id;
    const {
      vehicleId, tripId, bookingType, scheduledDate, scheduledEndDate,
      seatPreference, passengersCount,
      pickupName, pickupLat, pickupLng, pickupNote,
      dropoffName, dropoffLat, dropoffLng,
      purpose, notes, paymentMethod,
      rentalPeriodId,
    } = req.body;

    if (!vehicleId || !bookingType || !scheduledDate) {
      return res.status(400).json({ message: "vehicleId, bookingType et scheduledDate sont requis" });
    }

    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
      include: { agency: true, independentDriver: true },
    });
    if (!vehicle) return res.status(404).json({ message: "Véhicule introuvable" });
    if (vehicle.status !== 'ACTIVE') {
      return res.status(409).json({ message: "Ce véhicule n'est pas disponible actuellement" });
    }

    let totalPrice = vehicle.basePrice;
    let seatNumber = null;
    let trip = null;
    let rentalPeriod = null;
    let rentalDays = 0;

    if (bookingType === 'SHARED_SEAT') {
      if (!tripId) return res.status(400).json({ message: "tripId requis pour une place partagée" });
      trip = await prisma.trip.findUnique({ where: { id: tripId } });
      if (!trip) return res.status(404).json({ message: "Trajet introuvable" });
      if (trip.bookedSeats >= trip.totalSeats) {
        return res.status(409).json({ message: "Ce trajet est complet" });
      }
      totalPrice = trip.pricePerSeat * (passengersCount || 1);
      seatNumber = trip.bookedSeats + 1;
    } else if (['PRIVATE_FULL_DAY', 'CARGO_MOVING', 'POINT_TO_POINT'].includes(bookingType)) {
      totalPrice = vehicle.basePrice;
    } else if (bookingType === 'CAR_RENTAL') {
      if (!rentalPeriodId || !scheduledEndDate) {
        return res.status(400).json({ message: "rentalPeriodId et scheduledEndDate (date de fin de location) sont requis" });
      }
      rentalPeriod = await prisma.vehicleRentalPeriod.findUnique({ where: { id: rentalPeriodId } });
      if (!rentalPeriod || rentalPeriod.vehicleId !== vehicleId || !rentalPeriod.active) {
        return res.status(404).json({ message: "Cette période de location n'est plus disponible" });
      }
      const requestStart = new Date(scheduledDate);
      const requestEnd = new Date(scheduledEndDate);
      if (requestStart < rentalPeriod.startDate || requestEnd > rentalPeriod.endDate) {
        return res.status(400).json({ message: "Les dates choisies sortent de la période de location proposée par le propriétaire" });
      }
      rentalDays = daysBetweenInclusive(scheduledDate, scheduledEndDate);
      const remainingDays = rentalPeriod.totalDays - rentalPeriod.bookedDays;
      if (rentalDays > remainingDays) {
        return res.status(409).json({ message: `Il ne reste que ${remainingDays} jour(s) disponible(s) sur cette période` });
      }
      totalPrice = vehicle.basePrice * rentalDays;
    } else {
      return res.status(400).json({ message: "bookingType invalide" });
    }

    // Vérification anti-double-réservation : le backend est la seule source
    // de vérité, on ne fait jamais confiance uniquement à l'interface.
    const conflict = await findConflictingBooking({
      vehicleId,
      independentDriverId: vehicle.independentDriverId || undefined,
      start: scheduledDate,
      end: scheduledEndDate || null,
    });
    if (conflict) {
      return res.status(409).json({ message: "Ce véhicule n'est plus disponible pour ce créneau. Merci de choisir un autre véhicule ou un autre horaire." });
    }

    const reference = await nextBookingReference();
    const isIndependent = !!vehicle.independentDriverId;

    const booking = await prisma.$transaction(async (tx) => {
      const created = await tx.booking.create({
        data: {
          reference,
          userId,
          agencyId: isIndependent ? null : vehicle.agencyId,
          independentDriverId: isIndependent ? vehicle.independentDriverId : null,
          vehicleId,
          tripId: tripId || null,
          rentalPeriodId: rentalPeriod ? rentalPeriod.id : null,
          bookingType,
          scheduledDate: new Date(scheduledDate),
          scheduledEndDate: scheduledEndDate ? new Date(scheduledEndDate) : null,
          seatNumber,
          seatPreference: seatPreference || 'PEU_IMPORTE',
          passengersCount: passengersCount || 1,
          pickupName, pickupLat, pickupLng, pickupNote,
          dropoffName, dropoffLat, dropoffLng,
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

      if (rentalPeriod) {
        await tx.vehicleRentalPeriod.update({
          where: { id: rentalPeriod.id },
          data: { bookedDays: { increment: rentalDays } },
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

    await recordStatusEvent(booking.id, 'PENDING');

    const full = await prisma.booking.findUnique({ where: { id: booking.id }, include: BOOKING_INCLUDE });
    res.status(201).json(sanitizeBooking(full));

    // Diffusion temps réel + notification au professionnel concerné — jamais
    // l'usager ne parle directement à l'agence/au chauffeur, tout passe ici.
    try {
      const io = req.app.get('io');
      const when = new Date(scheduledDate).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' });
      const clientName = `${full.user.firstName} ${full.user.lastName}`;
      const body = `${clientName} • ${full.vehicle.brand} ${full.vehicle.model} • ${when} • ${totalPrice} KMF`;

      if (isIndependent) {
        await notifyIndependentDriver(io, {
          independentDriverId: vehicle.independentDriverId,
          title: '🔔 Nouvelle demande de réservation',
          body,
          bookingId: booking.id,
          smsTo: full.independentDriver?.phone,
        });
      } else {
        await notifyAgency(io, {
          agencyId: vehicle.agencyId,
          title: '🔔 Nouvelle réservation',
          body,
          bookingId: booking.id,
          smsTo: full.agency?.phone,
        });
      }

      await notifyUser(io, {
        userId,
        title: 'Demande envoyée',
        body: `Votre demande de réservation ${reference} a été transmise. Vous serez notifié dès la réponse.`,
        bookingId: booking.id,
      });
    } catch (e) { /* la diffusion ne doit jamais faire échouer la réservation */ }
  } catch (err) { next(err); }
}

// GET /api/bookings/mine (usager)
async function listMyBookings(req, res, next) {
  try {
    const bookings = await prisma.booking.findMany({
      where: { userId: req.auth.id },
      include: BOOKING_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
    res.json(bookings.map(sanitizeBooking));
  } catch (err) { next(err); }
}

// GET /api/bookings/:id
async function getBooking(req, res, next) {
  try {
    const booking = await prisma.booking.findUnique({ where: { id: req.params.id }, include: BOOKING_INCLUDE });
    if (!booking) return res.status(404).json({ message: "Réservation introuvable" });

    const { role, id, agencyId } = req.auth;
    const isOwnerUser = role === 'USER' && booking.userId === id;
    const isOwnerAgency = role === 'AGENCY_ADMIN' && booking.agencyId === agencyId;
    const isOwnerDriver = role === 'AGENCY_DRIVER' && booking.driverId === id;
    const isOwnerIndependent = role === 'INDEPENDENT_DRIVER' && booking.independentDriverId === id;
    if (!isOwnerUser && !isOwnerAgency && !isOwnerDriver && !isOwnerIndependent) {
      return res.status(403).json({ message: "Accès refusé" });
    }
    res.json(sanitizeBooking(booking));
  } catch (err) { next(err); }
}

// PATCH /api/bookings/:id/cancel (usager annule)
async function cancelBooking(req, res, next) {
  try {
    const booking = await prisma.booking.findUnique({ where: { id: req.params.id } });
    if (!booking || booking.userId !== req.auth.id) {
      return res.status(404).json({ message: "Réservation introuvable" });
    }
    if (['COMPLETED', 'CANCELLED', 'REJECTED', 'EXPIRED'].includes(booking.status)) {
      return res.status(400).json({ message: "Impossible d'annuler cette réservation" });
    }
    const updated = await prisma.booking.update({
      where: { id: req.params.id },
      data: { status: 'CANCELLED' },
      include: BOOKING_INCLUDE,
    });
    await recordStatusEvent(booking.id, 'CANCELLED', 'Annulée par l\'usager');
    if (booking.tripId) {
      await prisma.trip.update({
        where: { id: booking.tripId },
        data: { bookedSeats: { decrement: booking.passengersCount } },
      });
    }
    if (booking.rentalPeriodId && booking.scheduledEndDate) {
      await prisma.vehicleRentalPeriod.update({
        where: { id: booking.rentalPeriodId },
        data: { bookedDays: { decrement: daysBetweenInclusive(booking.scheduledDate, booking.scheduledEndDate) } },
      });
    }
    const io = req.app.get('io');
    await broadcastBookingUpdate(io, updated);
    if (updated.agencyId) {
      await notifyAgency(io, { agencyId: updated.agencyId, title: 'Réservation annulée', body: `${updated.reference} a été annulée par le client.`, bookingId: updated.id });
    }
    if (updated.independentDriverId) {
      await notifyIndependentDriver(io, { independentDriverId: updated.independentDriverId, title: 'Réservation annulée', body: `${updated.reference} a été annulée par le client.`, bookingId: updated.id });
    }
    if (updated.driverId) {
      await notifyDriver(io, { driverId: updated.driverId, title: 'Réservation annulée', body: `${updated.reference} a été annulée par le client.`, bookingId: updated.id });
    }
    res.json(sanitizeBooking(updated));
  } catch (err) { next(err); }
}

// PATCH /api/bookings/:id/message  { message }  (usager)
// Une fois la réservation acceptée par le professionnel (CONFIRMED et
// au-delà), l'usager doit pouvoir lui envoyer un message avec les détails
// (ex : déroulé d'un mariage). Un seul message par réservation pour
// l'instant — pas une conversation à rallonge.
async function sendDriverMessage(req, res, next) {
  try {
    const booking = await prisma.booking.findUnique({ where: { id: req.params.id } });
    if (!booking || booking.userId !== req.auth.id) {
      return res.status(404).json({ message: "Réservation introuvable" });
    }
    if (['PENDING', 'REJECTED', 'CANCELLED', 'EXPIRED'].includes(booking.status)) {
      return res.status(400).json({ message: "Le professionnel doit d'abord accepter la réservation avant de pouvoir lui écrire" });
    }
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ message: "Le message ne peut pas être vide" });
    }

    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: { driverMessage: message.trim(), driverMessageAt: new Date() },
      include: BOOKING_INCLUDE,
    });

    const io = req.app.get('io');
    const title = '💬 Message de votre client';
    const body = `${updated.reference} : "${message.trim().slice(0, 140)}"`;
    if (updated.independentDriverId) {
      await notifyIndependentDriver(io, { independentDriverId: updated.independentDriverId, title, body, bookingId: updated.id });
    }
    if (updated.driverId) {
      await notifyDriver(io, { driverId: updated.driverId, title, body, bookingId: updated.id });
    } else if (updated.agencyId) {
      await notifyAgency(io, { agencyId: updated.agencyId, title, body, bookingId: updated.id });
    }
    await broadcastBookingUpdate(io, updated);

    res.json(sanitizeBooking(updated));
  } catch (err) { next(err); }
}

// ---- Côté professionnel (agence, chauffeur d'agence, chauffeur indépendant) ----

// GET /api/bookings/agency/mine  (admin agence — toutes les réservations de l'agence)
async function listAgencyBookings(req, res, next) {
  try {
    const bookings = await prisma.booking.findMany({
      where: { agencyId: req.auth.agencyId },
      include: BOOKING_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
    res.json(bookings);
  } catch (err) { next(err); }
}

// GET /api/bookings/professional/mine  (chauffeur d'agence OU chauffeur indépendant —
// uniquement les réservations qui LEUR sont attribuées)
async function listMyProfessionalBookings(req, res, next) {
  try {
    const where = req.auth.role === 'INDEPENDENT_DRIVER'
      ? { independentDriverId: req.auth.id }
      : { driverId: req.auth.id };
    const bookings = await prisma.booking.findMany({
      where,
      include: BOOKING_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
    res.json(bookings);
  } catch (err) { next(err); }
}

function canActOnBooking(auth, booking) {
  if (auth.role === 'AGENCY_ADMIN') return booking.agencyId === auth.agencyId;
  if (auth.role === 'AGENCY_DRIVER') return booking.driverId === auth.id;
  if (auth.role === 'INDEPENDENT_DRIVER') return booking.independentDriverId === auth.id;
  return false;
}

// PATCH /api/bookings/:id/accept  (agence, chauffeur d'agence déjà attribué, ou chauffeur indépendant)
// EN ATTENTE -> (ACCEPTÉE ->) CONFIRMÉE, l'usager est notifié immédiatement.
async function acceptBooking(req, res, next) {
  try {
    const booking = await prisma.booking.findUnique({ where: { id: req.params.id } });
    if (!booking || !canActOnBooking(req.auth, booking)) {
      return res.status(404).json({ message: "Réservation introuvable" });
    }
    if (!['PENDING', 'DRIVER_ASSIGNED'].includes(booking.status)) {
      return res.status(400).json({ message: "Cette réservation ne peut plus être acceptée" });
    }

    // Un chauffeur d'agence qui accepte une course qui lui a été attribuée passe
    // directement à DRIVER_ARRIVING (il est déjà en chemin) ; sinon PENDING -> CONFIRMED.
    const newStatus = booking.status === 'DRIVER_ASSIGNED' ? 'DRIVER_ARRIVING' : 'CONFIRMED';

    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: { status: newStatus },
      include: BOOKING_INCLUDE,
    });
    await recordStatusEvent(booking.id, 'ACCEPTED', 'Accepté par le professionnel');
    await recordStatusEvent(booking.id, newStatus);

    const io = req.app.get('io');
    await broadcastBookingUpdate(io, updated);
    await notifyUser(io, {
      userId: updated.userId,
      title: '✅ Votre réservation est confirmée',
      body: `${updated.agency ? `Agence : ${updated.agency.name}` : `Chauffeur : ${updated.independentDriver.firstName} ${updated.independentDriver.lastName}`} • ${updated.vehicle.brand} ${updated.vehicle.model} • ${updated.totalPrice} KMF`,
      bookingId: updated.id,
      smsTo: updated.user.phone,
    });
    res.json(sanitizeBooking(updated));
  } catch (err) { next(err); }
}

// PATCH /api/bookings/:id/reject  (agence, chauffeur d'agence, ou chauffeur indépendant)
async function rejectBooking(req, res, next) {
  try {
    const booking = await prisma.booking.findUnique({ where: { id: req.params.id } });
    if (!booking || !canActOnBooking(req.auth, booking)) {
      return res.status(404).json({ message: "Réservation introuvable" });
    }
    if (!['PENDING', 'DRIVER_ASSIGNED'].includes(booking.status)) {
      return res.status(400).json({ message: "Cette réservation ne peut plus être refusée" });
    }

    // Si c'est le CHAUFFEUR d'agence (pas l'admin) qui refuse une course déjà
    // attribuée, elle repart en PENDING pour que l'agence réattribue un autre
    // chauffeur — le véhicule n'est PAS immédiatement rendu disponible côté agence.
    const isDriverDecline = req.auth.role === 'AGENCY_DRIVER' && booking.status === 'DRIVER_ASSIGNED';
    const newStatus = isDriverDecline ? 'PENDING' : 'REJECTED';

    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: { status: newStatus, driverId: isDriverDecline ? null : booking.driverId },
      include: BOOKING_INCLUDE,
    });
    await recordStatusEvent(booking.id, newStatus, isDriverDecline ? 'Chauffeur indisponible, réattribution nécessaire' : 'Refusé par le professionnel');

    const io = req.app.get('io');
    await broadcastBookingUpdate(io, updated);

    if (isDriverDecline) {
      await notifyAgency(io, { agencyId: updated.agencyId, title: 'Chauffeur indisponible', body: `${updated.reference} : le chauffeur assigné a refusé, merci d'en attribuer un autre.`, bookingId: updated.id });
    } else {
      await notifyUser(io, {
        userId: updated.userId,
        title: '❌ Votre demande de réservation n\'a pas pu être confirmée',
        body: `${updated.reference} a été refusée. Le véhicule reste disponible pour les autres usagers — vous pouvez réserver un autre véhicule.`,
        bookingId: updated.id,
        smsTo: updated.user.phone,
      });
    }
    res.json(sanitizeBooking(updated));
  } catch (err) { next(err); }
}

// PATCH /api/bookings/:id/assign-driver  { driverId }  (admin agence uniquement)
async function assignDriver(req, res, next) {
  try {
    const booking = await prisma.booking.findUnique({ where: { id: req.params.id } });
    if (!booking || booking.agencyId !== req.auth.agencyId) {
      return res.status(404).json({ message: "Réservation introuvable" });
    }
    if (!['CONFIRMED', 'DRIVER_ASSIGNED'].includes(booking.status)) {
      return res.status(400).json({ message: "La réservation doit être confirmée avant d'attribuer un chauffeur" });
    }
    const { driverId } = req.body;
    const driver = await prisma.driver.findUnique({ where: { id: driverId } });
    if (!driver || driver.agencyId !== req.auth.agencyId) {
      return res.status(404).json({ message: "Chauffeur introuvable pour cette agence" });
    }

    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: { status: 'DRIVER_ASSIGNED', driverId },
      include: BOOKING_INCLUDE,
    });
    await recordStatusEvent(booking.id, 'DRIVER_ASSIGNED', `Chauffeur attribué : ${driver.name}`);

    const io = req.app.get('io');
    await broadcastBookingUpdate(io, updated);
    await notifyDriver(io, {
      driverId,
      title: '🔔 Nouvelle course attribuée',
      body: `${updated.reference} • ${updated.pickupName || 'Départ'} → ${updated.dropoffName || 'Destination'} • ${updated.vehicle.brand} ${updated.vehicle.model} • ${updated.totalPrice} KMF`,
      bookingId: updated.id,
      smsTo: driver.phone,
    });
    await notifyUser(io, {
      userId: updated.userId,
      title: 'Un chauffeur vous a été attribué',
      body: `${driver.name} conduira votre trajet ${updated.reference}.`,
      bookingId: updated.id,
    });
    res.json(sanitizeBooking(updated));
  } catch (err) { next(err); }
}

const NEXT_ALLOWED = {
  CONFIRMED: ['DRIVER_ASSIGNED', 'DRIVER_ARRIVING', 'TRIP_STARTED', 'CANCELLED'],
  DRIVER_ASSIGNED: ['DRIVER_ARRIVING', 'CANCELLED'],
  DRIVER_ARRIVING: ['DRIVER_ARRIVED', 'CANCELLED'],
  DRIVER_ARRIVED: ['TRIP_STARTED', 'CANCELLED'],
  TRIP_STARTED: ['COMPLETED'],
};

const STATUS_MESSAGES = {
  DRIVER_ARRIVING: 'Votre chauffeur est en route.',
  DRIVER_ARRIVED: 'Votre chauffeur est arrivé au point de rendez-vous.',
  TRIP_STARTED: 'Votre trajet a commencé. Bon voyage !',
  COMPLETED: 'Votre trajet est terminé. Merci d\'avoir voyagé avec Raha.',
  CANCELLED: 'Votre réservation a été annulée par le professionnel.',
};

// PATCH /api/bookings/:id/status  { status }  — transitions fines du cycle de vie
// (agence, chauffeur d'agence attribué, ou chauffeur indépendant)
async function updateBookingStatus(req, res, next) {
  try {
    const booking = await prisma.booking.findUnique({ where: { id: req.params.id } });
    if (!booking || !canActOnBooking(req.auth, booking)) {
      return res.status(404).json({ message: "Réservation introuvable" });
    }
    const { status } = req.body;
    const allowed = NEXT_ALLOWED[booking.status] || [];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: `Transition invalide : ${booking.status} → ${status}` });
    }

    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: { status },
      include: BOOKING_INCLUDE,
    });
    await recordStatusEvent(booking.id, status);

    if (booking.tripId && status === 'CANCELLED') {
      await prisma.trip.update({ where: { id: booking.tripId }, data: { bookedSeats: { decrement: booking.passengersCount } } });
    }
    if (booking.rentalPeriodId && booking.scheduledEndDate && status === 'CANCELLED') {
      await prisma.vehicleRentalPeriod.update({
        where: { id: booking.rentalPeriodId },
        data: { bookedDays: { decrement: daysBetweenInclusive(booking.scheduledDate, booking.scheduledEndDate) } },
      });
    }

    const io = req.app.get('io');
    await broadcastBookingUpdate(io, updated);
    if (STATUS_MESSAGES[status]) {
      await notifyUser(io, {
        userId: updated.userId,
        title: status === 'CANCELLED' ? '❌ Réservation annulée' : 'Mise à jour de votre trajet',
        body: STATUS_MESSAGES[status],
        bookingId: updated.id,
      });
    }
    res.json(sanitizeBooking(updated));
  } catch (err) { next(err); }
}

module.exports = {
  createBooking, listMyBookings, getBooking, cancelBooking, sendDriverMessage,
  listAgencyBookings, listMyProfessionalBookings,
  acceptBooking, rejectBooking, assignDriver, updateBookingStatus,
};
