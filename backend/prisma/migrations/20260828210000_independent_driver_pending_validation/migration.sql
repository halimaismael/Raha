-- Un chauffeur indépendant n'est plus considéré comme un professionnel
-- pleinement vérifié dès son inscription. Le parcours réel est :
--   1) le chauffeur s'inscrit (ses identifiants de connexion — téléphone +
--      mot de passe — sont créés immédiatement, pour qu'il puisse déjà
--      utiliser l'application) ;
--   2) Raha vérifie son dossier (rendez-vous) ;
--   3) ce n'est qu'à cette validation que Raha lui attribue son identifiant
--      professionnel unique (RAHA-CH-xxxxxx).
-- On rend donc "professionalCode" optionnel (NULL tant que non validé) et
-- le statut par défaut passe de APPROVED à PENDING pour les NOUVEAUX
-- chauffeurs indépendants. Les comptes déjà existants (déjà APPROVED avec
-- un code déjà attribué) ne sont pas modifiés.

ALTER TABLE "independent_drivers" ALTER COLUMN "professionalCode" DROP NOT NULL;
ALTER TABLE "independent_drivers" ALTER COLUMN "status" SET DEFAULT 'PENDING';
