-- Les chauffeurs d'agence et les chauffeurs indépendants doivent avoir des
-- préfixes d'identifiant professionnel différents et bien distincts :
--   - chauffeur indépendant ("particulier")  -> RAHA-CH-xxxxxx (inchangé)
--   - chauffeur d'agence ("professionnel agence") -> RAHA-PA-xxxxxx (nouveau)
-- On crée une séquence dédiée et on renumérote les chauffeurs d'agence
-- existants (ils avaient jusqu'ici, par erreur, un code RAHA-CH comme les
-- indépendants, puisque les deux partageaient la même séquence).

CREATE SEQUENCE IF NOT EXISTS "raha_agency_driver_code_seq" START 1;

UPDATE "drivers"
SET "professionalCode" = 'RAHA-PA-' || LPAD(nextval('raha_agency_driver_code_seq')::text, 6, '0');
