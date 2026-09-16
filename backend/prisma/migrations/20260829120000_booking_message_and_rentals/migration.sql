-- Message obligatoire usager -> professionnel une fois la réservation acceptée
ALTER TABLE "bookings" ADD COLUMN "driverMessage" TEXT;
ALTER TABLE "bookings" ADD COLUMN "driverMessageAt" TIMESTAMP(3);

-- Nouveau type de réservation : location de voiture sur plusieurs jours
ALTER TYPE "BookingType" ADD VALUE 'CAR_RENTAL';

-- Périodes de mise en location d'un véhicule (chauffeur indépendant ou agence)
CREATE TABLE "vehicle_rental_periods" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "totalDays" INTEGER NOT NULL,
    "bookedDays" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicle_rental_periods_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "vehicle_rental_periods_vehicleId_active_idx" ON "vehicle_rental_periods"("vehicleId", "active");

ALTER TABLE "vehicle_rental_periods" ADD CONSTRAINT "vehicle_rental_periods_vehicleId_fkey"
    FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Réservation CAR_RENTAL : rattachée à la période dont elle décompte les jours
ALTER TABLE "bookings" ADD COLUMN "rentalPeriodId" TEXT;

ALTER TABLE "bookings" ADD CONSTRAINT "bookings_rentalPeriodId_fkey"
    FOREIGN KEY ("rentalPeriodId") REFERENCES "vehicle_rental_periods"("id") ON DELETE SET NULL ON UPDATE CASCADE;
