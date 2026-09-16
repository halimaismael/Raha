-- Raha Mwana : demande d'accompagnement scolaire + rendez-vous en agence

CREATE TYPE "MwanaDuration" AS ENUM ('UNE_SEMAINE', 'UN_MOIS', 'UN_TRIMESTRE', 'ANNEE_SCOLAIRE');

CREATE TYPE "MwanaRequestStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED');

-- Séquence pour les références RAHA-MW-xxxxxxxx (même principe que raha_booking_ref_seq)
CREATE SEQUENCE IF NOT EXISTS "raha_mwana_ref_seq" START 1;

CREATE TABLE "mwana_requests" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "duration" "MwanaDuration" NOT NULL,
    "numberOfPeople" INTEGER NOT NULL,
    "tripsPerDay" INTEGER NOT NULL,
    "city" TEXT NOT NULL,
    "contactFirstName" TEXT NOT NULL,
    "contactLastName" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "contactPhone" TEXT NOT NULL,
    "appointmentDate" TIMESTAMP(3) NOT NULL,
    "status" "MwanaRequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mwana_requests_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "mwana_requests_reference_key" ON "mwana_requests"("reference");

CREATE INDEX "mwana_requests_userId_idx" ON "mwana_requests"("userId");

CREATE INDEX "mwana_requests_status_appointmentDate_idx" ON "mwana_requests"("status", "appointmentDate");

ALTER TABLE "mwana_requests" ADD CONSTRAINT "mwana_requests_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
