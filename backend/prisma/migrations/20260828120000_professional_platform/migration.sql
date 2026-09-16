-- ============================================================
-- Raha — Migration "plateforme professionnelle"
-- Ajoute : identifiants professionnels uniques (RAHA-AG-/RAHA-CH-),
-- chauffeurs indépendants, disponibilité & tarifs, cycle de statuts
-- détaillé des réservations, notifications multi-destinataires.
--
-- ⚠️ À exécuter avec : npx prisma migrate deploy   (depuis backend/)
-- ⚠️ Si l'ajout de la contrainte UNIQUE sur drivers.phone échoue à cause
--    de doublons existants, corrigez les numéros en double puis relancez.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Séquences pour la génération des identifiants Raha
-- ------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS "raha_agency_code_seq" START 1;
CREATE SEQUENCE IF NOT EXISTS "raha_driver_code_seq" START 1;
CREATE SEQUENCE IF NOT EXISTS "raha_booking_ref_seq" START 1;

-- ------------------------------------------------------------
-- 2. Nouveaux enums
-- ------------------------------------------------------------
CREATE TYPE "AvailabilityStatus" AS ENUM ('AVAILABLE', 'UNAVAILABLE');
CREATE TYPE "PricingKind" AS ENUM ('MINIMUM', 'PER_TRIP', 'PER_KM', 'FULL_DAY', 'AIRPORT', 'HOURLY', 'CUSTOM');

-- BookingType : ajout de POINT_TO_POINT
ALTER TYPE "BookingType" ADD VALUE IF NOT EXISTS 'POINT_TO_POINT';

-- BookingStatus : remplacement complet (ONGOING -> TRIP_STARTED, + nouveaux statuts)
CREATE TYPE "BookingStatus_new" AS ENUM (
  'PENDING', 'ACCEPTED', 'CONFIRMED', 'DRIVER_ASSIGNED', 'DRIVER_ARRIVING',
  'DRIVER_ARRIVED', 'TRIP_STARTED', 'COMPLETED', 'REJECTED', 'CANCELLED', 'EXPIRED'
);
ALTER TABLE "bookings" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "bookings" ALTER COLUMN "status" TYPE "BookingStatus_new" USING (
  CASE "status"::text
    WHEN 'ONGOING' THEN 'TRIP_STARTED'
    ELSE "status"::text
  END
)::"BookingStatus_new";
ALTER TABLE "bookings" ALTER COLUMN "status" SET DEFAULT 'PENDING';
DROP TYPE "BookingStatus";
ALTER TYPE "BookingStatus_new" RENAME TO "BookingStatus";

-- ------------------------------------------------------------
-- 3. Chauffeurs indépendants
-- ------------------------------------------------------------
CREATE TABLE "independent_drivers" (
  "id"               TEXT NOT NULL,
  "professionalCode" TEXT NOT NULL,
  "firstName"        TEXT NOT NULL,
  "lastName"         TEXT NOT NULL,
  "phone"            TEXT NOT NULL,
  "email"            TEXT,
  "passwordHash"     TEXT NOT NULL,
  "photoUrl"         TEXT,
  "bio"              TEXT,
  "zones"            TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "services"         TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "licenseNumber"    TEXT,
  "status"           "AgencyStatus" NOT NULL DEFAULT 'APPROVED',
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"        TIMESTAMP(3) NOT NULL,
  CONSTRAINT "independent_drivers_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "independent_drivers_professionalCode_key" ON "independent_drivers"("professionalCode");
CREATE UNIQUE INDEX "independent_drivers_phone_key" ON "independent_drivers"("phone");
CREATE UNIQUE INDEX "independent_drivers_email_key" ON "independent_drivers"("email");

CREATE TABLE "driver_pricing" (
  "id"                  TEXT NOT NULL,
  "independentDriverId" TEXT NOT NULL,
  "kind"                "PricingKind" NOT NULL,
  "label"               TEXT,
  "amount"              DOUBLE PRECISION NOT NULL,
  "createdAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"           TIMESTAMP(3) NOT NULL,
  CONSTRAINT "driver_pricing_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "driver_pricing" ADD CONSTRAINT "driver_pricing_independentDriverId_fkey"
  FOREIGN KEY ("independentDriverId") REFERENCES "independent_drivers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "driver_availability" (
  "id"                  TEXT NOT NULL,
  "driverId"            TEXT,
  "independentDriverId" TEXT,
  "date"                DATE NOT NULL,
  "status"              "AvailabilityStatus" NOT NULL DEFAULT 'AVAILABLE',
  "startTime"           TEXT,
  "endTime"             TEXT,
  "createdAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"           TIMESTAMP(3) NOT NULL,
  CONSTRAINT "driver_availability_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "driver_availability_driverId_date_key" ON "driver_availability"("driverId", "date");
CREATE UNIQUE INDEX "driver_availability_independentDriverId_date_key" ON "driver_availability"("independentDriverId", "date");
ALTER TABLE "driver_availability" ADD CONSTRAINT "driver_availability_driverId_fkey"
  FOREIGN KEY ("driverId") REFERENCES "drivers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "driver_availability" ADD CONSTRAINT "driver_availability_independentDriverId_fkey"
  FOREIGN KEY ("independentDriverId") REFERENCES "independent_drivers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "driver_availability" ADD CONSTRAINT "driver_availability_owner_check"
  CHECK (("driverId" IS NOT NULL) OR ("independentDriverId" IS NOT NULL));

-- ------------------------------------------------------------
-- 4. Identifiants professionnels — agences
-- ------------------------------------------------------------
ALTER TABLE "agencies" ADD COLUMN "professionalCode" TEXT;
UPDATE "agencies" SET "professionalCode" = 'RAHA-AG-' || LPAD(nextval('raha_agency_code_seq')::text, 6, '0')
  WHERE "professionalCode" IS NULL;
ALTER TABLE "agencies" ALTER COLUMN "professionalCode" SET NOT NULL;
CREATE UNIQUE INDEX "agencies_professionalCode_key" ON "agencies"("professionalCode");

-- ------------------------------------------------------------
-- 5. Chauffeurs d'agence : identifiant, compte de connexion, statut actif
-- ------------------------------------------------------------
ALTER TABLE "drivers" ADD COLUMN "professionalCode" TEXT;
ALTER TABLE "drivers" ADD COLUMN "passwordHash" TEXT;
ALTER TABLE "drivers" ADD COLUMN "active" BOOLEAN NOT NULL DEFAULT true;
UPDATE "drivers" SET "professionalCode" = 'RAHA-CH-' || LPAD(nextval('raha_driver_code_seq')::text, 6, '0')
  WHERE "professionalCode" IS NULL;
ALTER TABLE "drivers" ALTER COLUMN "professionalCode" SET NOT NULL;
CREATE UNIQUE INDEX "drivers_professionalCode_key" ON "drivers"("professionalCode");
-- NB: si cette contrainte échoue, deux chauffeurs existants partagent le même numéro —
-- corrigez le doublon puis relancez la migration.
CREATE UNIQUE INDEX "drivers_phone_key" ON "drivers"("phone");

-- ------------------------------------------------------------
-- 6. Véhicules : propriétaire agence OU chauffeur indépendant
-- ------------------------------------------------------------
ALTER TABLE "vehicles" ALTER COLUMN "agencyId" DROP NOT NULL;
ALTER TABLE "vehicles" ADD COLUMN "independentDriverId" TEXT;
ALTER TABLE "vehicles" ADD COLUMN "transmission" TEXT;
ALTER TABLE "vehicles" ADD COLUMN "year" INTEGER;
ALTER TABLE "vehicles" ADD COLUMN "description" TEXT;
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_independentDriverId_fkey"
  FOREIGN KEY ("independentDriverId") REFERENCES "independent_drivers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_owner_check"
  CHECK (("agencyId" IS NOT NULL) OR ("independentDriverId" IS NOT NULL));

-- ------------------------------------------------------------
-- 7. Réservations : chauffeur attribué, chauffeur indépendant, créneau de fin
-- ------------------------------------------------------------
ALTER TABLE "bookings" ALTER COLUMN "agencyId" DROP NOT NULL;
ALTER TABLE "bookings" ADD COLUMN "driverId" TEXT;
ALTER TABLE "bookings" ADD COLUMN "independentDriverId" TEXT;
ALTER TABLE "bookings" ADD COLUMN "scheduledEndDate" TIMESTAMP(3);
ALTER TABLE "bookings" ADD COLUMN "pickupNote" TEXT;

ALTER TABLE "bookings" ADD CONSTRAINT "bookings_driverId_fkey"
  FOREIGN KEY ("driverId") REFERENCES "drivers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_independentDriverId_fkey"
  FOREIGN KEY ("independentDriverId") REFERENCES "independent_drivers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_owner_check"
  CHECK (("agencyId" IS NOT NULL) OR ("independentDriverId" IS NOT NULL));

CREATE INDEX "bookings_vehicleId_scheduledDate_scheduledEndDate_idx" ON "bookings"("vehicleId", "scheduledDate", "scheduledEndDate");
CREATE INDEX "bookings_driverId_scheduledDate_scheduledEndDate_idx" ON "bookings"("driverId", "scheduledDate", "scheduledEndDate");
CREATE INDEX "bookings_independentDriverId_scheduledDate_scheduledEndDate_idx" ON "bookings"("independentDriverId", "scheduledDate", "scheduledEndDate");

CREATE TABLE "booking_status_events" (
  "id"        TEXT NOT NULL,
  "bookingId" TEXT NOT NULL,
  "status"    "BookingStatus" NOT NULL,
  "note"      TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "booking_status_events_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "booking_status_events" ADD CONSTRAINT "booking_status_events_bookingId_fkey"
  FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Trace l'état déjà existant de chaque réservation pour ne rien perdre de l'historique.
-- (md5/random plutôt que gen_random_uuid() pour ne dépendre d'aucune extension Postgres)
INSERT INTO "booking_status_events" ("id", "bookingId", "status", "createdAt")
  SELECT md5(random()::text || clock_timestamp()::text || "id")::uuid::text, "id", "status", "createdAt" FROM "bookings";

-- ------------------------------------------------------------
-- 8. Notifications : destinataire = usager OU admin agence OU chauffeur
--    d'agence OU chauffeur indépendant ; liées à une réservation
-- ------------------------------------------------------------
ALTER TABLE "notifications" ALTER COLUMN "userId" DROP NOT NULL;
ALTER TABLE "notifications" ADD COLUMN "agencyAdminId" TEXT;
ALTER TABLE "notifications" ADD COLUMN "driverId" TEXT;
ALTER TABLE "notifications" ADD COLUMN "independentDriverId" TEXT;
ALTER TABLE "notifications" ADD COLUMN "bookingId" TEXT;

ALTER TABLE "notifications" ADD CONSTRAINT "notifications_agencyAdminId_fkey"
  FOREIGN KEY ("agencyAdminId") REFERENCES "agency_admins"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_driverId_fkey"
  FOREIGN KEY ("driverId") REFERENCES "drivers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_independentDriverId_fkey"
  FOREIGN KEY ("independentDriverId") REFERENCES "independent_drivers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_bookingId_fkey"
  FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "notifications_userId_read_idx" ON "notifications"("userId", "read");
CREATE INDEX "notifications_agencyAdminId_read_idx" ON "notifications"("agencyAdminId", "read");
CREATE INDEX "notifications_driverId_read_idx" ON "notifications"("driverId", "read");
CREATE INDEX "notifications_independentDriverId_read_idx" ON "notifications"("independentDriverId", "read");
