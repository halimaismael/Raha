const prisma = require('../config/db');

// Statuts qui bloquent réellement un véhicule / un chauffeur pour une période.
// Une réservation REJECTED / CANCELLED / EXPIRED libère immédiatement le créneau.
const BLOCKING_STATUSES = [
  'PENDING', 'ACCEPTED', 'CONFIRMED', 'DRIVER_ASSIGNED',
  'DRIVER_ARRIVING', 'DRIVER_ARRIVED', 'TRIP_STARTED',
];

// Durée par défaut appliquée quand aucune heure de fin n'est fournie
// (trajet point-à-point sans durée connue à l'avance) — évite qu'un
// trajet "sans fin" bloque un véhicule indéfiniment tout en empêchant
// deux réservations quasi simultanées sur le même véhicule/chauffeur.
const DEFAULT_DURATION_MS = 90 * 60 * 1000; // 90 minutes

function withDefaultEnd(start, end) {
  if (end) return new Date(end);
  return new Date(new Date(start).getTime() + DEFAULT_DURATION_MS);
}

function overlaps(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}

// Cherche une réservation existante (active) qui chevauche le créneau demandé,
// pour ce véhicule OU ce chauffeur (agence ou indépendant). Retourne la
// réservation en conflit, ou null si le créneau est libre.
async function findConflictingBooking({ vehicleId, driverId, independentDriverId, start, end, excludeBookingId }) {
  const s = new Date(start);
  const e = withDefaultEnd(start, end);

  const or = [{ vehicleId }];
  if (driverId) or.push({ driverId });
  if (independentDriverId) or.push({ independentDriverId });

  const candidates = await prisma.booking.findMany({
    where: {
      status: { in: BLOCKING_STATUSES },
      OR: or,
      ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
    },
    select: { id: true, scheduledDate: true, scheduledEndDate: true, reference: true },
  });

  return (
    candidates.find((b) => {
      const bs = new Date(b.scheduledDate);
      const be = withDefaultEnd(b.scheduledDate, b.scheduledEndDate);
      return overlaps(s, e, bs, be);
    }) || null
  );
}

// Un chauffeur indépendant (ou d'agence) a-t-il marqué cette date comme
// indisponible dans son calendrier ? (point 19 du cahier des charges)
async function isDriverUnavailableOnDate({ driverId, independentDriverId, date }) {
  if (!driverId && !independentDriverId) return false;
  const day = new Date(date);
  const dayOnly = new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate()));
  const entry = await prisma.driverAvailability.findFirst({
    where: {
      date: dayOnly,
      ...(driverId ? { driverId } : {}),
      ...(independentDriverId ? { independentDriverId } : {}),
    },
  });
  return entry?.status === 'UNAVAILABLE';
}

module.exports = { findConflictingBooking, isDriverUnavailableOnDate, withDefaultEnd, BLOCKING_STATUSES };
