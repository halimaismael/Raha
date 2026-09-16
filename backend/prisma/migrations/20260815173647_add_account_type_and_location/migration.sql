-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('AGENCE', 'PARTICULIER');

-- AlterTable
ALTER TABLE "agencies" ADD COLUMN     "type" "AccountType" NOT NULL DEFAULT 'AGENCE';

-- AlterTable
ALTER TABLE "vehicles" ADD COLUMN     "currentLat" DOUBLE PRECISION,
ADD COLUMN     "currentLng" DOUBLE PRECISION,
ADD COLUMN     "locationUpdatedAt" TIMESTAMP(3);
