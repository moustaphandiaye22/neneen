# neneen

Application web de sorties et boutique pour neneen, avec un frontend React et une API Node.js connectée à PostgreSQL sur Neon.

## Organisation

- `frontend/` : React, TypeScript, Vite et interface client / administration.
- `frontend/src/App.tsx` : composition des écrans et parcours UI; `frontend/src/services/` : accès API, auth, activités, boutique, compte, contact et administration.
- `backend/src/modules/` : contrôleurs HTTP et règles d’accès des domaines `auth`, `catalog`, `customer` et `admin`.
- `backend/src/services/` : règles métier et orchestration; `backend/src/repositories/` : opérations Prisma et transactions.
- `shared/contracts/` : schémas Zod et messages de validation français utilisés par le frontend et l’API.
- `backend/prisma/` : schéma de données, migrations versionnées et données de démonstration.

Les contrats partagés définissent une seule fois les formats, les limites et les messages d’erreur des formulaires. Les prix, les stocks, les états et la capacité des activités restent contrôlés côté serveur. Les fiches d’activité détaillent aussi durée, programme, inclusions et éléments à prévoir. Les réservations et commandes sont créées en attente de paiement.

## Démarrage

Prérequis : Node.js 22 ou ultérieur, npm et un projet PostgreSQL Neon.

1. Copier `.env.example` vers `backend/.env`.
2. Dans `backend/.env`, renseigner `DATABASE_URL` avec l’URL Neon (activer SSL), renseigner `DIRECT_URL` avec l’URL Neon directe, remplacer `JWT_SECRET` par une valeur aléatoire d’au moins 32 caractères et définir `ADMIN_EMAIL` / `ADMIN_PASSWORD` (12 caractères minimum).
3. Installer les dépendances des trois workspaces depuis la racine : `npm install`.
4. Après validation sur une branche Neon, appliquer les migrations : `npm run db:deploy`.
5. Charger les activités, produits et le compte administrateur initial : `npm run db:seed`.
6. Démarrer l’API et le frontend : `npm run dev`.

`ADMIN_EMAIL` et `ADMIN_PASSWORD` sont requis pour provisionner le compte admin au seed. Si ces variables ne sont pas configurées, les données du catalogue sont chargées, mais aucun admin n’est créé.

Le site est servi sur `http://localhost:5173` et l’API sur `http://localhost:4000/api`. Vérifier l’API avec `http://localhost:4000/api/health`.

Les migrations sont versionnées ; `db:deploy` applique celles qui manquent. L’URL de l’API côté frontend peut être changée dans `frontend/.env` à partir de `frontend/.env.example`.

## Qualité

- `npm run lint` : ESLint sur le monorepo.
- `npm run format` et `npm run format:check` : formatage et vérification Prettier.
- `npx prisma format --schema backend/prisma/schema.prisma` : formatage du schéma Prisma.
- `npm run build` : compilation des contrats partagés, de l’API et du frontend.

## Fonctionnalités

- Catalogue public d’activités et boutique, détail des sorties, tailles, panier et formulaire de contact.
- Création de compte et connexion par e-mail, espace client avec réservations et commandes.
- Réservations avec contrôle transactionnel des places et commandes avec contrôle transactionnel des stocks.
- Console admin protégée par rôle : indicateurs, création et modification d’activités/produits, suivi des réservations, commandes et messages.
- Validation des entrées, hachage des mots de passe, JWT, limitation des tentatives de connexion, Helmet et CORS.

## Paiements et intégrations

Les paiements Wave, Orange Money et carte sont préparés via PayDunya et restent
inactifs sans clés. Les espèces sur place et le paiement à la livraison sont
disponibles. Voir [la réalisation et ses limites](docs/IMPLEMENTATION.md),
ainsi que [la spécification OpenAPI](backend/openapi.yaml).

Les variables dans `backend/.env.example` permettent de configurer PayDunya,
Resend, WhatsApp et Cloudinary. `DIRECT_URL` doit viser l’endpoint Neon direct
pour les migrations ; `DATABASE_URL` peut utiliser l’endpoint poolé.

`frontend/.env.example` contient l’URL de l’API et les coordonnées publiques
réelles à afficher. Les liens WhatsApp n’apparaissent qu’après configuration.
