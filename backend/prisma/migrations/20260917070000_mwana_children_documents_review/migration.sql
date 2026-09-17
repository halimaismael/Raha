-- Raha Mwana : noms des enfants, justificatifs (documents) soumis à la prise
-- de rendez-vous, et case "dossier vérifié" côté équipe Raha (AgenceRaha).

ALTER TABLE "mwana_requests" ADD COLUMN "childrenNames" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "mwana_requests" ADD COLUMN "documents" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "mwana_requests" ADD COLUMN "dossierReviewed" BOOLEAN NOT NULL DEFAULT false;
