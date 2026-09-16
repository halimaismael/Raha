-- AlterTable
ALTER TABLE "agencies"
ADD COLUMN "licenseB" BOOLEAN,
ADD COLUMN "licenseType" "VehicleType",
ADD COLUMN "ownsVehicle" BOOLEAN,
ADD COLUMN "appointmentDate" TIMESTAMP(3);
