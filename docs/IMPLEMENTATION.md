# Réalisation du cahier des charges neneen

## Fonctionnement livré

- Configuration Zod, API Express, erreurs centralisées, Helmet, CORS, limites de requêtes, connexion Prisma avant écoute et arrêt propre.
- Schéma Prisma versionné avec utilisateurs, tokens renouvelables, activités, réservations, produits, variantes, paniers, commandes, paiements, notifications, liste d’attente, contenus, newsletter et audit.
- Authentification Argon2id, migration douce des anciens mots de passe bcrypt, JWT courts, refresh token rotatif en cookie HttpOnly, déconnexion, e-mail de vérification, oubli et réinitialisation du mot de passe, profil, changement de mot de passe et suppression logique du compte.
- Catalogue, recherche et pagination côté API, activité mise en avant, programme, filtre par type, calendrier, détail produit et tailles.
- Réservations avec contrôle transactionnel des places, échéance de paiement, expiration automatique, annulation avant J-7, liste d’attente, référence, billet QR et check-in.
- Panier invité local fusionné avec le panier du compte, variantes et stock par taille, commandes avec livraison 0/2 000/4 000 FCFA. Le stock est décrémenté lors du paiement confirmé, avec rattrapage sur remboursement/annulation.
- Interface PaymentProvider pour Wave, Orange Money et carte via PayDunya, plus espèces. L’API PayDunya est inactive sans clés. Webhook avec vérification du hash puis confirmation serveur, contrôle du montant et traitement idempotent. Reçu PDF. Les remboursements sont suivis par état et confirmés manuellement par le personnel après leur exécution chez le prestataire.
- Notifications en file persistante et réessayées, via Resend et WhatsApp Cloud API lorsque configurés. E-mails de compte, confirmations, rappels, changements de statut et place libérée.
- Administration : dashboard, activités, produits, stock par taille, commandes, réservations, messages, participants CSV, contenus FAQ/CGV/mentions, check-in. Les opérations sensibles de remboursement et check-in sont auditées.
- Images : URL ou import signé Cloudinary lorsque configuré. Frontend mobile existant conservé avec React Query pour le catalogue, formulaire d’accès React Hook Form/Zod, pages publiques et 404. Fichier OpenAPI, Docker et GitHub Actions.

## Limites nécessitant des informations externes

- PayDunya, Resend, Meta WhatsApp et Cloudinary exigent des comptes et des clés propres à neneen. Les paiements en ligne restent désactivés tant que `PAYMENT_MODE=disabled`. Le remboursement PayDunya est suivi en interne puis exécuté manuellement chez le prestataire ; aucune API de remboursement vers le moyen d’origine n’a été supposée.
- Les mentions légales et CGV livrées sont des contenus de démonstration : raison sociale, NINEA, RCCM, conditions et contacts réels restent à renseigner avant publication.
- Les URLs `#/...` du frontend React sont accessibles dans le navigateur, mais les pages internes ne sont pas pré-rendues pour les moteurs de recherche. Le sitemap statique doit être aligné sur le domaine réellement déployé. Un passage aux vraies routes et au pré-rendu est nécessaire pour un SEO complet.
- La migration a été vérifiée sur une branche Neon temporaire, puis appliquée avec autorisation à `br-still-violet-b48l84xa` (projet `bold-star-26895357`). Elle est enregistrée dans l’historique Prisma ; `prisma migrate status` confirme que le schéma est à jour.
- Les tests couvrent les services de domaine ajoutés et les erreurs HTTP ; les parcours complets contre une branche Neon et les prestataires en sandbox restent à exécuter avec leurs accès.
- L’audit npm signale encore trois alertes « high » dans la chaîne `prisma` → `@prisma/config` → `deepmerge-ts`. La mise à niveau de Prisma et son contrôle de compatibilité restent à planifier ; une compilation et les tests actuels ne prouvent pas l’absence de vulnérabilités.

## Commandes

```bash
npm ci
npm run db:generate
npm run db:deploy
npm run db:seed
npm run dev
npm test
npm run lint
npm run format:check
npm run build
docker compose up --build
```

Pour `db:deploy`, définir `DIRECT_URL` sur la connexion Neon **directe**, sans `-pooler` ; `DATABASE_URL` peut rester la connexion poolée de l’application. Une branche de test Neon est recommandée pour valider la migration et le seed avant l’application à la base principale.

## Fichiers ajoutés ou modifiés

- `backend/prisma/schema.prisma`, `backend/prisma/migrations/20261004000000_full_spec/migration.sql`, `backend/prisma/seed.ts`
- `backend/src/app.ts`, `backend/src/index.ts`, `backend/src/config/environment.ts`, `backend/src/middleware.ts`
- `backend/src/domains/*` (routes, services, dépôts et providers regroupés par fonctionnalité), `backend/src/errors/*`, `backend/src/jobs/housekeeping.ts`, `backend/src/utils/tokens.ts`
- `backend/tests/foundation.test.ts`, `backend/tests/services.test.ts`, `backend/openapi.yaml`, `backend/Dockerfile`, `backend/package.json`
- `shared/contracts/src/index.ts`
- `frontend/src/App.tsx`, `frontend/src/main.tsx`, `frontend/src/types.ts`, `frontend/src/features/*`, `frontend/src/components/layout/*`, `frontend/src/lib/*`, `frontend/src/services/*`, `frontend/index.html`, `frontend/public/robots.txt`, `frontend/public/sitemap.xml`, `frontend/Dockerfile`, `frontend/nginx.conf`, `frontend/.env.example`
- `.env.example`, `package.json`, `package-lock.json`, `docker-compose.yml`, `.dockerignore`, `.github/workflows/ci.yml`, `README.md`
