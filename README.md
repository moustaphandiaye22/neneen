# neneen

neneen est une application de sorties et de boutique à Dakar. Elle permet de consulter des activités, réserver des places, acheter des T-shirts, suivre ses réservations et commandes, et administrer le catalogue et les opérations.

Le dépôt contient une application React, une API Express et des contrats de validation partagés. PostgreSQL conserve les données métier. La cible de production est **Render pour le backend**, **Vercel pour le frontend** et une **base PostgreSQL externe, notamment Neon**.

Ce document décrit le code présent dans le dépôt. La présence d’une fonctionnalité ou d’une configuration ne signifie pas que les comptes prestataires sont activés ni que l’application est déjà déployée. Les différences entre les écrans, les possibilités de l’API et les travaux restants sont précisées plus bas.

## Sommaire

- [Fonctionnalités et parcours](#fonctionnalités-et-parcours)
- [Architecture et organisation](#architecture-et-organisation)
- [Installation locale](#installation-locale)
- [Variables de configuration](#variables-de-configuration)
- [Données et règles métier](#données-et-règles-métier)
- [Authentification et autorisations](#authentification-et-autorisations)
- [API HTTP](#api-http)
- [Paiements et remboursements](#paiements-et-remboursements)
- [Notifications et tâches périodiques](#notifications-et-tâches-périodiques)
- [Images et identité visuelle](#images-et-identité-visuelle)
- [Administration](#administration)
- [Commandes de développement](#commandes-de-développement)
- [Docker et tests de la pile](#docker-et-tests-de-la-pile)
- [Déploiement Render et Vercel](#déploiement-render-et-vercel)
- [CI/CD GitHub Actions](#cicd-github-actions)
- [Tests et vérification avant mise en ligne](#tests-et-vérification-avant-mise-en-ligne)
- [Exploitation et dépannage](#exploitation-et-dépannage)
- [Limites connues](#limites-connues)
- [Contribuer et faire évoluer le projet](#contribuer-et-faire-évoluer-le-projet)
- [Documents de référence](#documents-de-référence)

## Fonctionnalités et parcours

### Pages publiques

Le frontend utilise des routes dans le fragment de l’URL : `https://votre-domaine/#/shop`, par exemple. La navigation est pilotée par `frontend/src/App.tsx` et l’événement `hashchange`.

| Route navigateur               | Contenu                                                            |
| ------------------------------ | ------------------------------------------------------------------ |
| `#/`                           | Accueil, présentation, activités et produits                       |
| `#/activities`                 | Liste des sorties et filtre par type                               |
| `#/calendar`                   | Calendrier des activités                                           |
| `#/activity/:id`               | Description, date, programme, inclusions et informations pratiques |
| `#/booking/:id`                | Réservation d’une activité ; connexion nécessaire pour confirmer   |
| `#/shop`                       | Boutique et présentation de l’identité neneen                      |
| `#/product/:id`                | Fiche produit, coloris, tailles, stock et produits associés        |
| `#/cart`                       | Panier et modification des quantités                               |
| `#/checkout`                   | Validation de commande et choix du paiement                        |
| `#/about`                      | Présentation de la marque et formulaire de contact                 |
| `#/contact`                    | Contact                                                            |
| `#/faq`, `#/cgv`, `#/mentions` | Contenus d’information et pages légales                            |
| `#/login`                      | Connexion et inscription                                           |
| `#/forgot-password`            | Demande de réinitialisation                                        |
| `#/reset-password?token=…`     | Nouveau mot de passe via un lien temporaire                        |
| `#/verify-email?token=…`       | Validation d’adresse e-mail                                        |
| `#/account`                    | Espace personnel                                                   |
| `#/admin`                      | Interface du personnel et des administrateurs                      |

Une page dédiée gère les routes inconnues et les activités ou produits indisponibles. Les prix sont affichés en FCFA ; les paiements utilisent la devise `XOF`.

### Réserver une sortie

1. Consulter une activité publiée et à venir.
2. Choisir le nombre de places et se connecter.
3. Créer une réservation : le backend calcule le total et réserve les places dans une transaction.
4. Pour un paiement en ligne, poursuivre vers le prestataire puis consulter le résultat dans l’espace personnel.
5. Consulter le billet QR lorsque les conditions d’accès sont remplies. L’équipe peut contrôler ce billet à l’entrée.

Les activités ont les types `EXCURSION`, `AFTERWORK` ou `EVENT`. L’API propose également une liste d’attente lorsqu’une activité est complète et une annulation client sous conditions.

**Moyens de paiement des réservations :** l’écran d’activité conserve Wave, Orange Money, carte lorsque les paiements en ligne sont disponibles, et espèces sur place. Ce parcours n’est pas identique au checkout de la boutique.

### Acheter un produit

1. Choisir un T-shirt, sa taille et sa quantité.
2. Ajouter au panier depuis la carte, la fenêtre produit ou sa fiche.
3. Le panier invité est conservé dans `localStorage`. Après connexion, il est fusionné avec le panier du compte et synchronisé avec l’API.
4. Confirmer la commande en étant connecté.
5. Choisir **Wave ou Orange Money**, puis poursuivre le paiement.

Le checkout actuel ne propose **ni carte bancaire, ni paiement au livreur, ni formulaire de livraison**. Il envoie `shippingFee: 0` et la consigne `Retrait à convenir avec neneen` pour rester compatible avec le modèle de commande existant. Cela n’organise pas automatiquement un retrait : ses modalités restent à convenir avec l’équipe.

Si les paiements en ligne sont désactivés, les deux choix sont visibles mais indisponibles et la confirmation est bloquée. Une commande créée reste consultable même si l’ouverture du paiement échoue ; création de commande et paiement réussi sont deux étapes distinctes.

## Architecture et organisation

```text
Navigateur
  └─ Frontend React sur Vercel
       └─ /api/* : proxy HTTPS vers Render
            └─ API Express dans Docker
                 ├─ PostgreSQL / Neon : données et files persistantes
                 ├─ PayDunya : paiement hébergé
                 ├─ Resend : e-mails
                 ├─ WhatsApp Cloud API : notifications
                 └─ Cloudinary : signature d’import d’images
```

En développement, le proxy Vite transmet `/api` à `http://localhost:4000`. Avec Docker Compose, Nginx assure ce rôle. En production Vercel, le proxy est généré au build depuis `RENDER_API_ORIGIN`.

### Technologies

| Partie    | Technologies principales                                                               |
| --------- | -------------------------------------------------------------------------------------- |
| Frontend  | React 19, TypeScript, Vite 8, TanStack React Query, React Hook Form, Zod, Lucide, CSS  |
| Backend   | Node.js 22, Express 5, TypeScript, Prisma 6, PostgreSQL                                |
| Sessions  | JWT, jetons renouvelables, Argon2 et prise en charge des anciens hashes bcrypt         |
| Documents | PDFKit pour les reçus, QRCode pour les billets                                         |
| Qualité   | ESLint, Prettier, tests Node.js avec `tsx`                                             |
| Livraison | Docker multi-stage, Compose, GitHub Actions, Render Blueprint, Vercel Build Output API |

Les versions réellement installées sont verrouillées dans `package-lock.json`. Les trois workspaces npm sont `backend`, `frontend` et `shared/contracts` ; installer les dépendances depuis la racine.

```text
.
├── backend/
│   ├── src/
│   │   ├── app.ts                  # Express, middleware et routes
│   │   ├── index.ts                # Connexion DB, serveur, jobs, arrêt propre
│   │   ├── config/                 # Validation des variables
│   │   ├── domains/                # auth, catalog, commerce, payments,
│   │   │                          # admin, content, notifications, uploads
│   │   ├── jobs/                   # Expirations, rappels, notifications
│   │   ├── errors/                 # Erreurs HTTP centralisées
│   │   ├── lib/                    # Client Prisma
│   │   └── middleware.ts           # Authentification et rôles
│   ├── prisma/                     # Schéma, migrations et seed
│   ├── tests/                      # Tests backend
│   ├── openapi.yaml                # Description API complémentaire
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── App.tsx                 # Composition et navigation
│   │   ├── features/               # Pages et logique par domaine
│   │   ├── components/layout/      # En-tête, pied de page, messages
│   │   ├── services/               # Appels API et validation
│   │   ├── lib/                    # Présentation et images de collection
│   │   ├── types.ts
│   │   └── site.css
│   ├── public/                     # Logos, photos, robots.txt, sitemap
│   ├── nginx.conf
│   └── Dockerfile
├── shared/contracts/src/index.ts   # Schémas Zod communs
├── scripts/build-vercel.mjs        # Build statique et routage Vercel
├── tests/deployment/               # Configuration isolée et smoke HTTP
├── docs/                          # Guides complémentaires
├── .github/workflows/ci.yml
├── docker-compose.yml
├── docker-compose.test.yml
├── render.yaml
└── vercel.json
```

Les routes backend délèguent généralement aux services métier, puis aux repositories Prisma. Les providers isolent les prestataires de paiement et de notification. Les contrats partagés sont compilés avant les consommateurs ; modifier leur source nécessite de les reconstruire.

## Installation locale

### Prérequis

- Node.js **22** et npm, pour rester aligné sur les images et la CI.
- Une base PostgreSQL accessible ; une branche Neon dédiée au développement convient.
- Git. Docker et Docker Compose sont nécessaires seulement pour les parcours conteneurisés.
- Les comptes prestataires ne sont requis que pour les fonctionnalités correspondantes.

### Première installation

Depuis la racine du dépôt :

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
npm ci
```

Remplacer les valeurs d’exemple de `backend/.env`, notamment `DATABASE_URL`, `DIRECT_URL` et `JWT_SECRET`. Une commande pour produire un secret aléatoire est :

```bash
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

Ensuite, sur la base de développement choisie :

```bash
npm --workspace @neneen/contracts run build
npm run db:generate
npm run db:deploy
npm run db:seed
npm run dev
```

| Service                         | URL locale                               |
| ------------------------------- | ---------------------------------------- |
| Frontend Vite                   | `http://localhost:5173`                  |
| API                             | `http://localhost:4000/api`              |
| Processus vivant                | `http://localhost:4000/api/health`       |
| API et connexion DB disponibles | `http://localhost:4000/api/ready`        |
| Spécification API               | `http://localhost:4000/api/openapi.yaml` |

Le script `dev` lance les deux applications. Il ne compile pas automatiquement les contrats partagés : après modification de `shared/contracts/src`, relancer leur build. Le build de production complet se fait avec `npm run build`.

### Seed et premier administrateur

Le seed fournit cinq activités de démonstration, cinq déclinaisons du T-shirt Build Different, les variantes de taille, les catégories, les options de couleur/taille et des pages d’information initiales.

Pour créer l’administrateur, définir `ADMIN_EMAIL` et `ADMIN_PASSWORD` dans `backend/.env` avant `npm run db:seed`. Le mot de passe doit comporter au moins 12 caractères. Sans les deux variables, aucun administrateur n’est créé.

**Le seed n’est pas une migration de production.** Il utilise des upserts, mais peut réécrire des données de démonstration et réinitialiser le mot de passe de l’administrateur configuré. Examiner `backend/prisma/seed.ts` avant de le relancer sur une base utilisée. Aucun seed n’est exécuté automatiquement par Docker ou Render.

## Variables de configuration

Les fichiers `.env` restent locaux et ne doivent pas être versionnés. Les exemples ne contiennent pas de secrets utilisables. Les valeurs `VITE_*` sont intégrées au JavaScript du navigateur et sont donc publiques.

### Backend : environnement et base

| Variable               | Valeur / contrainte                                        | Usage                                                               |
| ---------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------- |
| `NODE_ENV`             | `development`, `test`, `production` ; défaut `development` | Comportement d’exécution et cookie sécurisé en production           |
| `DATABASE_URL`         | URL `postgresql://` ou `postgres://`, requise              | Connexion applicative ; URL poolée Neon possible                    |
| `DIRECT_URL`           | URL PostgreSQL directe                                     | Schéma Prisma et migrations ; utiliser l’hôte Neon sans `-pooler`   |
| `JWT_SECRET`           | Au moins 32 caractères, requis                             | Signature des jetons d’accès                                        |
| `PORT`                 | 1 à 65535 ; défaut `4000`                                  | Port HTTP du backend                                                |
| `FRONTEND_URL`         | Origine HTTP(S) ; défaut `http://localhost:5173`           | CORS, liens de compte, retours de paiement                          |
| `PUBLIC_API_URL`       | URL publique ; défaut `http://localhost:4000`              | Callback et retour PayDunya ; origine sans `/api`                   |
| `TRUST_PROXY_HOPS`     | Entier de 0 à 5 ; défaut `0`                               | Nombre de sauts proxy approuvés ; Compose et Render configurent `1` |
| `BOOKING_HOLD_MINUTES` | 5 à 60 ; défaut `15`                                       | Durée de retenue des places avant paiement en ligne                 |
| `ADMIN_EMAIL`          | Adresse du premier administrateur                          | Utilisée seulement par le seed                                      |
| `ADMIN_PASSWORD`       | Au moins 12 caractères                                     | Utilisée seulement par le seed                                      |

En production, utiliser les origines HTTPS finales, sans slash terminal. Conserver `JWT_SECRET` stable entre déploiements ; le changer invalide les anciens jetons d’accès.

### Backend : prestataires

| Variable                | Fonction                                                                                    |
| ----------------------- | ------------------------------------------------------------------------------------------- |
| `PAYMENT_MODE`          | `disabled` par défaut, `sandbox` ou `live`                                                  |
| `PAYDUNYA_MASTER_KEY`   | Clé principale PayDunya                                                                     |
| `PAYDUNYA_PRIVATE_KEY`  | Clé privée PayDunya                                                                         |
| `PAYDUNYA_TOKEN`        | Token PayDunya                                                                              |
| `RESEND_API_KEY`        | Envoi des e-mails                                                                           |
| `EMAIL_FROM`            | Expéditeur ; défaut `neneen <contact@neneen.sn>` ; domaine à configurer chez le prestataire |
| `WHATSAPP_TOKEN`        | Token WhatsApp Cloud API                                                                    |
| `WHATSAPP_PHONE_ID`     | Identifiant du numéro WhatsApp émetteur                                                     |
| `WHATSAPP_TEMPLATE`     | Modèle de message ; défaut `neneen_notification`                                            |
| `WHATSAPP_API_VERSION`  | Version d’API utilisée ; défaut du code `v23.0`                                             |
| `CLOUDINARY_CLOUD_NAME` | Cloud de stockage des images                                                                |
| `CLOUDINARY_API_KEY`    | Clé de signature des imports                                                                |
| `CLOUDINARY_API_SECRET` | Secret de signature ; backend uniquement                                                    |

En mode `sandbox` ou `live`, les trois variables PayDunya sont nécessaires. En mode `live`, la validation impose HTTPS pour `FRONTEND_URL` et `PUBLIC_API_URL`. Le numéro WhatsApp affiché sur le site et les identifiants techniques de l’API WhatsApp sont deux configurations différentes.

### Frontend, Vercel et Compose

| Variable                                  | Emplacement                   | Usage                                                           |
| ----------------------------------------- | ----------------------------- | --------------------------------------------------------------- |
| `VITE_API_URL`                            | `frontend/.env`, build Docker | Base API ; défaut `/api`. Le build Vercel l’impose à `/api`     |
| `VITE_WHATSAPP_NUMBER`                    | Build frontend                | Numéro de contact public au format international                |
| `VITE_CONTACT_EMAIL`                      | Build frontend                | E-mail de contact public                                        |
| `RENDER_API_ORIGIN`                       | Vercel, au build              | Origine HTTPS Render, sans `/api`, query string ni identifiants |
| `BACKEND_ENV_FILE`                        | Compose                       | Fichier injecté aux services ; défaut `backend/.env`            |
| `WEB_PORT`                                | Compose                       | Port publié du frontend ; défaut `5173`                         |
| `API_IMAGE`, `WEB_IMAGE`, `MIGRATE_IMAGE` | Compose                       | Noms d’images ; valeurs locales par défaut                      |
| `COMPOSE_PROJECT_NAME`                    | Compose                       | Nom de la pile, utile pour isoler les tests                     |
| `COMPOSE_FILE`                            | Compose                       | Liste des fichiers Compose à fusionner                          |
| `SMOKE_URL`                               | Script de test HTTP           | Origine testée ; défaut `http://localhost:15173`                |

Les variables publiques du build Docker proviennent du shell ou du `.env` de la racine, pas du `backend/.env`. Changer une variable frontend nécessite un nouveau build. Ne jamais placer `DATABASE_URL`, `JWT_SECRET` ou les clés prestataires dans une variable `VITE_*`.

## Données et règles métier

Le schéma complet est [backend/prisma/schema.prisma](backend/prisma/schema.prisma). Les montants métier sont des entiers en FCFA/XOF.

| Modèles                                   | Rôle                                                               |
| ----------------------------------------- | ------------------------------------------------------------------ |
| `User`, `RefreshToken`, `ActionToken`     | Identité, rôles, sessions et actions temporaires                   |
| `Activity`, `ActivityCategory`            | Sorties, capacité, programme et catégories                         |
| `Booking`, `Waitlist`                     | Réservations, retenue de places, billets et liste d’attente        |
| `Product`, `ProductVariant`               | Catalogue et stock par taille ; variante unique par produit/taille |
| `ProductColorOption`, `ProductSizeOption` | Choix persistants des formulaires produit                          |
| `Cart`, `CartItem`                        | Panier du compte ; une ligne par produit/taille                    |
| `Order`, `OrderItem`                      | Commande, totaux et copie des noms/prix au moment de l’achat       |
| `Payment`, `PaymentEvent`                 | Paiement, idempotence et événements traités                        |
| `Notification`                            | File d’envoi persistante, tentatives et échéance de reprise        |
| `ContactMessage`                          | Messages entrants, statut et texte de réponse                      |
| `Content`, `NewsletterSubscriber`         | Pages éditoriales et inscriptions newsletter                       |
| `AuditLog`                                | Trace d’actions administratives                                    |
| `SiteSettings`                            | Paramètres enregistrés du site                                     |

### Réservations

- Activité réservée uniquement si publiée et à venir.
- Verrouillage de l’activité dans une transaction pour contrôler la capacité et éviter la sur-réservation.
- Total calculé à partir du prix de l’activité en base.
- Réservation en ligne initialement `PENDING`, puis `CONFIRMED` après confirmation du paiement.
- Retenue expirée libérée par la tâche périodique. Le parcours `CASH` ne fixe pas cette échéance.
- Annulation client gratuite autorisée jusqu’à sept jours avant le début, d’après la règle implémentée.
- Billet disponible pour une réservation confirmée ou une réservation en attente avec paiement en espèces.
- La notification d’une place libérée n’attribue pas automatiquement cette place.

### Commandes et panier

- Le serveur relit les produits actifs, tailles et prix. Les prix envoyés par le navigateur ne font pas autorité.
- Le stock est contrôlé à la création ; cette étape ne garantit pas une retenue exclusive jusqu’au paiement.
- L’engagement du stock est traité lors de la confirmation de paiement et suivi par `stockCommitted`.
- Les transitions de commande sont contrôlées : `PENDING`, `PAID`, `PROCESSING`, `SHIPPED`, `COMPLETED`, `CANCELLED`. Certaines transitions dépendent du moyen de paiement.
- La fusion du panier limite une ligne à 20 unités et le panier à 30 références ; les lignes sont ajustées aux variantes disponibles.
- Le checkout envoie zéro frais. L’API conserve toutefois les champs et les valeurs historiques de livraison `0`, `2000`, `4000` : leur retrait de l’interface n’est pas une suppression du contrat serveur.

### Migrations

`npm run db:migrate` sert au développement des migrations. `npm run db:deploy` applique uniquement les migrations versionnées qui manquent. Ne pas remplacer le déploiement par un reset de base ou par un `db push` improvisé.

Sauvegarder une base utilisée avant une évolution de schéma ; vérifier les migrations sur une branche Neon ou une base de test. Le retour à une ancienne image applicative n’annule pas les changements SQL.

## Authentification et autorisations

Les mots de passe utilisent Argon2 ; le provider sait aussi vérifier les anciens hashes bcrypt. Le jeton d’accès JWT dure **15 minutes**, avec issuer `neneen`, audience `neneen-web` et version de session. Le middleware relit l’utilisateur et son rôle en base.

Le renouvellement utilise un jeton rotatif, stocké hashé en base et transmis dans le cookie `neneen_refresh` : `HttpOnly`, `SameSite=Strict`, chemin `/api/auth`, durée de 30 jours et `Secure` en production. Les jetons de vérification d’e-mail et de réinitialisation expirent après une heure.

Le frontend conserve le JWT et les informations publiques de session dans `localStorage`. Sur certaines réponses `401`, le client tente un renouvellement unique, puis rejoue la requête. Le JWT n’est donc pas protégé par un cookie HttpOnly : la prévention des injections de scripts reste importante.

| Rôle       | Droits principaux                                                              |
| ---------- | ------------------------------------------------------------------------------ |
| Visiteur   | Catalogue, contenu public, contact, inscription, connexion                     |
| `CUSTOMER` | Ses réservations, commandes, paiements, billets, panier et profil              |
| `STAFF`    | Opérations d’administration autorisées : catalogue, suivi, contrôles, contenus |
| `ADMIN`    | Droits STAFF, paramètres du site, changement des rôles et lecture des audits   |

Les gardes backend font autorité, même si un écran ou un lien est masqué. Les endpoints de suppression de compte et de renvoi de vérification existent, mais ne sont pas nécessairement exposés par toutes les vues du compte.

Le proxy `/api` de Vercel conserve les appels navigateur sur le domaine frontend, ce qui évite de dépendre de cookies tiers entre `vercel.app` et `onrender.com`. Ne pas remplacer ce proxy par des appels directs sans revoir le comportement des sessions.

## API HTTP

Toutes les routes ci-dessous sont préfixées par **`/api`**. Pour les routes authentifiées, envoyer `Authorization: Bearer <jeton>`. Les corps sont en JSON, sauf le webhook PayDunya qui accepte aussi le format prévu par son middleware et les réponses de type CSV/PDF.

### Routes publiques et authentification

| Méthode | Route                                                                 | Fonction                                                      |
| ------- | --------------------------------------------------------------------- | ------------------------------------------------------------- |
| GET     | `/health`, `/ready`                                                   | Santé du processus et disponibilité de PostgreSQL             |
| GET     | `/openapi.yaml`                                                       | Spécification YAML                                            |
| GET     | `/activities`, `/activities/:id`, `/activities/search`                | Catalogue et recherche d’activités                            |
| GET     | `/products`, `/products/:id`, `/products/search`                      | Catalogue et recherche de produits                            |
| POST    | `/contact`                                                            | Message de contact                                            |
| GET     | `/content/:slug`                                                      | Contenu publié                                                |
| POST    | `/newsletter`                                                         | Enregistrement d’une inscription                              |
| POST    | `/auth/register`, `/auth/login`                                       | Création du compte et connexion                               |
| POST    | `/auth/refresh`, `/auth/logout`                                       | Rotation ou révocation du cookie de session                   |
| POST    | `/auth/forgot-password`, `/auth/reset-password`, `/auth/verify-email` | Actions temporaires                                           |
| GET     | `/payments/config`                                                    | Disponibilité des paiements en ligne                          |
| GET     | `/payments/return`                                                    | Retour PayDunya avec token ; synchronisation puis redirection |
| POST    | `/payments/webhook`                                                   | Notification prestataire vérifiée côté serveur                |

Les endpoints `/activities/search` et `/products/search` acceptent `page` (défaut 1), `limit` (1 à 100, défaut 50), `search` (100 caractères maximum), `sort` (`date`, `price`, `name`) et, pour le filtrage d’activités, `type` (`EXCURSION`, `AFTERWORK`, `EVENT`). Le catalogue actuellement chargé par le frontend utilise les routes de liste ; l’existence d’une recherche paginée dans l’API ne signifie pas que chaque écran utilise cette pagination.

### Routes du compte connecté

| Méthode   | Route                                                | Fonction                               |
| --------- | ---------------------------------------------------- | -------------------------------------- |
| GET       | `/auth/me`                                           | Profil courant                         |
| PATCH     | `/auth/profile`                                      | Modifier le profil                     |
| POST      | `/auth/change-password`, `/auth/resend-verification` | Mot de passe et e-mail de vérification |
| DELETE    | `/auth/account`                                      | Suppression logique du compte          |
| GET, POST | `/bookings`                                          | Lister ses réservations ou réserver    |
| POST      | `/bookings/:id/cancel`                               | Annuler selon les règles métier        |
| GET       | `/bookings/:id/ticket`                               | Réservation et QR encodé en image      |
| POST      | `/activities/:id/waitlist`                           | Rejoindre la liste d’attente           |
| GET, POST | `/orders`                                            | Lister ses commandes ou commander      |
| GET, PUT  | `/cart`                                              | Lire ou remplacer le panier            |
| POST      | `/cart/merge`                                        | Fusionner le panier invité             |
| GET, POST | `/payments`                                          | Lister ses paiements ou en initier un  |
| GET       | `/payments/:id`                                      | Lire un paiement                       |
| GET       | `/payments/:id/receipt.pdf`                          | Télécharger le reçu autorisé           |

### Routes de gestion : STAFF ou ADMIN

| Méthode   | Route                                                                                        | Fonction                                                                 |
| --------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| GET       | `/admin/dashboard`                                                                           | Indicateurs                                                              |
| GET, POST | `/admin/activities`, `/admin/products`                                                       | Lister ou créer                                                          |
| PATCH     | `/admin/activities/:id`, `/admin/products/:id`                                               | Modifier                                                                 |
| DELETE    | `/admin/activities/:id`                                                                      | Annuler une activité                                                     |
| DELETE    | `/admin/products/:id`                                                                        | Masquer un produit                                                       |
| DELETE    | `/admin/activities/:id/delete`, `/admin/products/:id/delete`                                 | Suppression définitive selon les contraintes du repository et de la base |
| GET       | `/admin/product-options`                                                                     | Couleurs et tailles                                                      |
| PUT       | `/admin/products/:id/variants`                                                               | Mettre à jour le stock d’une taille                                      |
| GET       | `/admin/customers`, `/admin/bookings`, `/admin/orders`, `/admin/payments`, `/admin/messages` | Listes de suivi                                                          |
| PATCH     | `/admin/bookings/:id`, `/admin/orders/:id`, `/admin/messages/:id`                            | Mise à jour de statut                                                    |
| POST      | `/admin/messages/:id/reply`                                                                  | Enregistrer une réponse                                                  |
| GET       | `/admin/content`                                                                             | Lister les pages gérées                                                  |
| PUT       | `/admin/content/:slug`                                                                       | Enregistrer une page                                                     |
| GET       | `/admin/activities/:id/participants.csv`                                                     | Export participants                                                      |
| POST      | `/admin/check-in`                                                                            | Contrôler un secret de billet                                            |
| POST      | `/admin/uploads/sign`                                                                        | Signature d’import Cloudinary                                            |
| POST      | `/payments/:id/confirm-cash`                                                                 | Confirmer les espèces reçues                                             |
| POST      | `/payments/:id/confirm-refund`                                                               | Confirmer un remboursement exécuté hors de l’application                 |

### Routes réservées à ADMIN

| Méthode    | Route                       | Fonction                                   |
| ---------- | --------------------------- | ------------------------------------------ |
| GET, PATCH | `/admin/settings`           | Lire et enregistrer les paramètres du site |
| PATCH      | `/admin/customers/:id/role` | Modifier un rôle                           |
| GET        | `/admin/audit-logs`         | Consulter le journal d’audit               |

### Formats, erreurs et exemples

Les champs exacts et limites de validation se trouvent dans [shared/contracts/src/index.ts](shared/contracts/src/index.ts). Les validations spécifiques à une route se trouvent dans les fichiers `routes.ts`. La spécification OpenAPI complète cette documentation, mais doit être comparée aux routes lors d’une évolution : elle n’est pas générée automatiquement.

```bash
curl --fail http://localhost:4000/api/ready
curl --fail http://localhost:4000/api/products
```

Exemple de corps de commande correspondant au checkout actuel :

```json
{
  "shippingAddress": "Retrait à convenir avec neneen",
  "shippingFee": 0,
  "paymentMethod": "WAVE",
  "items": [{ "productId": "IDENTIFIANT_PRODUIT", "size": "M", "quantity": 1 }]
}
```

Exemple d’initiation de paiement après création d’une commande :

```json
{
  "orderId": "IDENTIFIANT_COMMANDE",
  "method": "WAVE",
  "idempotencyKey": "UUID_UNIQUE_POUR_CETTE_TENTATIVE"
}
```

Une erreur JSON expose généralement `message`, et `issues` en cas de validation Zod. Les codes courants sont `400` (entrée invalide), `401` (session), `403` (droits), `404` (ressource), `409` (conflit métier), `413` (corps trop volumineux), `429` (limitation), et `5xx` (serveur ou prestataire). Certaines routes inconnues peuvent rencontrer le middleware d’authentification avant le handler 404.

Les corps JSON sont limités à 1 Mo et les données de webhook encodées à 32 Ko. Les routes d’authentification sont limitées à 30 requêtes par 15 minutes ; le contact à 5 par heure. La confiance proxy doit correspondre à l’infrastructure pour que ces limites identifient correctement les clients.

## Paiements et remboursements

Les providers Wave, Orange Money et carte utilisent **PayDunya** ; ce ne sont pas des intégrations directes séparées avec chaque opérateur. Le provider espèces conserve un paiement en attente jusqu’à confirmation par le personnel.

1. Une commande ou réservation est créée en attente.
2. L’API initie un paiement appartenant à l’utilisateur, avec une clé d’idempotence.
3. Le client suit le `checkoutUrl` du prestataire.
4. Le webhook ou le retour de paiement déclenche une vérification serveur auprès de PayDunya.
5. Les montants et l’état vérifiés servent à mettre à jour les données métier.

La seule visite d’une page de succès ne constitue pas une preuve de paiement. Le webhook vérifie un hash et la synchronisation consulte le prestataire. Les statuts internes sont `PENDING`, `SUCCEEDED`, `FAILED`, `REFUND_PENDING` et `REFUNDED`.

Configurer les URL accessibles depuis Internet :

- Retour : `<PUBLIC_API_URL>/api/payments/return`.
- Notification : `<PUBLIC_API_URL>/api/payments/webhook`.
- Retour utilisateur après traitement : `<FRONTEND_URL>/#/account`.

`GET /api/payments/config` utilise `PAYMENT_MODE` et les clés PayDunya. Le champ administratif `SiteSettings.paymentsLive` ne remplace pas cette configuration.

**Remboursement :** l’application suit la demande et sa confirmation, mais le provider ne réalise pas automatiquement un remboursement financier. Le personnel doit l’exécuter chez le prestataire, puis enregistrer une référence de confirmation. Tester le parcours complet en sandbox avant d’activer les encaissements réels.

## Notifications et tâches périodiques

Une minuterie du processus backend lance le housekeeping toutes les 60 secondes :

1. Libération des réservations en attente expirées, par lots de 100.
2. Notification de disponibilité pour la liste d’attente, par lots de 100.
3. Préparation des rappels pour les réservations confirmées dans les prochaines 24 heures, par lots de 200.
4. Distribution des notifications persistantes, par lots de 20.

Les envois utilisent Resend ou WhatsApp Cloud API. La file comporte des clés de déduplication et une prise de travail transactionnelle. Les erreurs entraînent des reprises à délai croissant, plafonné à une heure, puis l’état `FAILED` après six tentatives. Les traitements bloqués peuvent être remis en attente.

Ces tâches ne constituent pas un cron externe : si le processus est arrêté ou suspendu, elles ne tournent pas. Évaluer les volumes, les lots, les chevauchements d’exécution et le nombre d’instances avant une montée en charge. Ne pas présenter une notification mise en file comme déjà livrée.

## Images et identité visuelle

Les visuels fournis de la marque sont servis depuis `frontend/public/images` :

| Dossier     | Usage                                               |
| ----------- | --------------------------------------------------- |
| `brand/`    | Logos blanc/bordeaux, sacs, étiquettes et ruban     |
| `products/` | Photos du T-shirt Build Different et de ses détails |
| `payments/` | Logos Wave et Orange Money                          |

Les photos produit extraites du PDF sont des visuels de collection en blanc. `frontend/src/lib/productImages.ts` les applique aux T-shirts nommés « T-shirt Build Different » sans image propre. Une image renseignée par l’administration reste prioritaire. Les autres coloris conservent leurs informations et la fiche précise le coloris du visuel.

L’administration peut importer une image via Cloudinary : le backend produit une signature et le navigateur envoie le fichier au prestataire. Le secret Cloudinary reste côté serveur. Les images importées ne sont pas stockées sur le disque éphémère de Render. Sans configuration Cloudinary, cet import est indisponible.

Certaines illustrations publiques utilisent encore des URL Unsplash. Les remplacer si nécessaire avec des fichiers adaptés et des droits d’utilisation vérifiés.

## Administration

L’interface comporte des vues de tableau de bord, activités, réservations, commandes, paiements, produits, clients, messages, paramètres et contrôle des entrées.

- **Activités :** créer/modifier, publier ou annuler, gérer le programme, la capacité et l’image ; exporter les participants.
- **Produits :** gérer fiches, couleur, tailles, image, visibilité et stock par taille. Masquage et suppression définitive sont des opérations différentes.
- **Opérations :** suivre les réservations et commandes, confirmer des espèces, enregistrer un remboursement déjà exécuté, contrôler un billet.
- **Clients :** consulter les comptes ; changement de rôle réservé à ADMIN.
- **Messages :** consulter, marquer le statut et enregistrer une réponse. L’enregistrement du texte de réponse ne doit pas être confondu avec une preuve d’envoi d’e-mail.
- **Contenus :** endpoints pour les pages FAQ, CGV, mentions et autres slugs gérés.
- **Paramètres :** nom, slogan, contacts, adresse, liens sociaux dont TikTok et indicateur de paiement, enregistrés dans `SiteSettings`.

Les paramètres stockés ne sont pas tous raccordés au frontend public : des contacts proviennent encore de variables Vite ou de valeurs de repli. Modifier `SiteSettings` ne recompile pas le frontend et n’active pas PayDunya.

Le routeur admin journalise certaines mutations réussies ; des opérations de contrôle et de remboursement disposent aussi de traces. Ce journal n’est pas une capture exhaustive de toutes les lectures et actions utilisateur.

## Commandes de développement

Toutes les commandes ci-dessous partent de la racine, sauf indication.

| Commande                                      | Effet                                                                          |
| --------------------------------------------- | ------------------------------------------------------------------------------ |
| `npm ci`                                      | Installation reproductible depuis le lockfile                                  |
| `npm run dev`                                 | Backend et frontend en développement                                           |
| `npm run dev:backend`, `npm run dev:frontend` | Démarrer un seul côté                                                          |
| `npm --workspace @neneen/contracts run build` | Compiler les contrats partagés                                                 |
| `npm run db:generate`                         | Générer le client Prisma                                                       |
| `npm run db:migrate`                          | Créer/appliquer une migration de développement                                 |
| `npm run db:deploy`                           | Appliquer les migrations versionnées                                           |
| `npm run db:seed`                             | Charger les données initiales ; lire les précautions sur le seed               |
| `npm run build`                               | Compiler contrats, backend et frontend                                         |
| `npm --prefix backend start`                  | Démarrer le backend compilé                                                    |
| `npm --prefix frontend run preview`           | Prévisualiser le build statique ; ne remplace pas le routage API de production |
| `npm run lint`, `npm run lint:fix`            | Vérifier/corriger le lint du monorepo                                          |
| `npm run format`, `npm run format:check`      | Appliquer/vérifier Prettier sur les fichiers couverts par ces scripts          |
| `npm test`                                    | Tests backend                                                                  |
| `node scripts/build-vercel.mjs`               | Build Vercel ; exige `RENDER_API_ORIGIN`                                       |
| `node tests/deployment/smoke.mjs`             | Test HTTP d’une pile déjà démarrée                                             |

Le script `frontend` nommé `lint` utilise Oxlint ; la référence CI du monorepo reste `npm run lint` à la racine, qui utilise ESLint. Les fichiers de déploiement ont aussi un contrôle Prettier explicite dans la CI.

## Docker et tests de la pile

### Images

- **Backend :** compilation multi-stage ; cible `runtime` avec Node, dépendances, code compilé, contrats, Prisma et migrations ; exécution avec l’utilisateur `node`.
- **Migrations :** cible `migrate`, commande `prisma migrate deploy`, sans seed automatique.
- **Frontend :** build Vite, puis fichiers statiques servis par Nginx non privilégié sur le port interne `8080`.
- **Contexte :** toujours la racine du dépôt, pour accéder au lockfile et aux workspaces.
- **Exclusions :** dépendances locales, builds, `.env`, fichiers privés et répertoires de travail ne doivent pas entrer dans les images ; voir `.dockerignore`.

### Compose avec PostgreSQL externe

Après configuration de `backend/.env` :

```bash
docker compose build --pull
docker compose up -d --wait --wait-timeout 120
docker compose ps
curl --fail http://localhost:5173/api/ready
```

L’ordre est `migrate` terminé avec succès → `api` disponible → `web`. Seul le frontend publie un port hôte. Compose ne crée pas de base de production locale et ne fournit pas de certificat TLS : la base reste externe et HTTPS doit être assuré par l’hébergement ou un proxy approprié.

Le backend redémarre selon la politique Compose et dispose d’un arrêt propre. Nginx relaie `/api`, garde le HTML revalidable et met en cache les assets versionnés. Le healthcheck API teste PostgreSQL ; celui du frontend teste `/healthz`.

### Test isolé sans Neon

Exécuter ce bloc dans un terminal dédié :

```bash
export BACKEND_ENV_FILE=tests/deployment/backend.env
export WEB_PORT=15173
export COMPOSE_PROJECT_NAME=neneen-ci
export COMPOSE_FILE=docker-compose.yml:docker-compose.test.yml

docker compose build
docker compose up -d --wait --wait-timeout 120
node tests/deployment/smoke.mjs
docker compose run --rm migrate
docker compose down --volumes --remove-orphans
```

Cette pile crée un PostgreSQL temporaire en mémoire, sans port base publié. Ses identifiants sont uniquement des valeurs de test. La commande finale supprime cette pile de test ; ne pas la réutiliser sans vérifier le projet Compose sélectionné. Fermer le terminal dédié évite de conserver ces variables pour une autre opération.

## Déploiement Render et Vercel

Le guide détaillé se trouve dans [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

### 1. Préparer le backend Render

Créer un Blueprint depuis le dépôt avec [render.yaml](render.yaml). Garder la racine du dépôt comme contexte Docker, même si le Dockerfile se trouve dans `backend/`.

La configuration versionnée prévoit :

- Service `neneen-api`, runtime Docker et plan **Starter, payant**.
- Commande avant déploiement : `npm run db:deploy`.
- Démarrage : CMD de l’image, `node dist/src/index.js`.
- Santé : `/api/ready`.
- Déploiement automatique après réussite des checks GitHub (`checksPass`).

Renseigner `DATABASE_URL`, `DIRECT_URL`, `FRONTEND_URL` et `PUBLIC_API_URL`. Le Blueprint génère `JWT_SECRET` ; le conserver ensuite. Ajouter les clés des prestataires utilisés. Le mode de paiement initial est `disabled`.

Le pré-déploiement des migrations nécessite une offre Render compatible ; la configuration fournie utilise Starter. Un choix gratuit nécessite une procédure séparée de migration, documentée dans le guide. La présence du Blueprint ne crée pas elle-même un service ni un abonnement.

### 2. Préparer le frontend Vercel

Importer le même dépôt, avec **Root Directory à la racine**, preset **Other** et Node.js **22**. Conserver [vercel.json](vercel.json), sans forcer un dossier de sortie personnalisé.

Définir :

```dotenv
RENDER_API_ORIGIN=https://VOTRE-SERVICE.onrender.com
VITE_WHATSAPP_NUMBER=VOTRE_NUMERO_INTERNATIONAL
VITE_CONTACT_EMAIL=VOTRE_EMAIL_PUBLIC
```

Le script de build valide l’origine HTTPS, compile les contrats puis le frontend, impose `/api` comme base et écrit `.vercel/output/static` et `.vercel/output/config.json`. Vercel sert les fichiers et transmet les requêtes `/api/*` à Render. Aucune clé de base ou de paiement n’est nécessaire côté Vercel.

Les URL ci-dessus sont des exemples à remplacer, pas des adresses de services provisionnés. Une fois l’adresse Vercel connue, la reporter dans `FRONTEND_URL` sur Render. Utiliser des variables Preview pointant vers une infrastructure de staging distincte lorsque possible.

### 3. Vérifier le déploiement

1. Vérifier `/api/ready` directement sur Render, puis via le domaine Vercel.
2. Vérifier catalogue, images et pages.
3. Tester connexion, renouvellement après expiration du JWT et déconnexion depuis Vercel.
4. Vérifier les liens e-mail et les URL PayDunya.
5. Tester le paiement en sandbox, les callbacks et le reçu avant le mode réel.
6. Contrôler les adresses IP vues par le rate limiter : Vercel puis Render ajoutent des intermédiaires réseau.

Références officielles : [Render Blueprint](https://render.com/docs/blueprint-spec), [Vercel Build Output API](https://vercel.com/docs/build-output-api).

## CI/CD GitHub Actions

Le workflow [.github/workflows/ci.yml](.github/workflows/ci.yml) est déclenché sur push, pull request et lancement manuel. Il possède des délais limites, des permissions de lecture par défaut et annule les runs devenus obsolètes sur une même référence.

**Job `verify` :** Node 22, `npm ci`, génération Prisma, ESLint, Prettier, actionlint, tests backend, compilation complète et génération du build Vercel avec une origine fictive de contrôle.

**Job `containers` :** après `verify`, validation Compose, construction des images, PostgreSQL isolé, migrations, healthchecks, smoke HTTP, seconde exécution des migrations et nettoyage même en cas d’échec. Les logs sont imprimés en cas d’échec.

Le workflow **ne publie plus d’images GHCR et ne déclenche pas un déploiement via des tokens Render/Vercel**. Les plateformes utilisent leurs intégrations Git. Render attend les checks selon le Blueprint. Vercel n’attend pas automatiquement cette CI : protéger la branche de production, interdire les push directs et exiger `verify` et `containers` avant fusion.

Les protections de branche, projets, variables et connexions Git sont des réglages externes au dépôt. Un YAML correct ne prouve pas qu’ils sont actifs. La mise à jour du code doit être poussée sur GitHub pour que le workflow distant s’exécute.

## Tests et vérification avant mise en ligne

### Contrôles automatisés disponibles

```bash
npm run lint
npm run format:check
npm test
npm run build
```

Les tests backend couvrent notamment validation d’environnement, erreurs HTTP, transitions métier, fusion de panier, idempotence d’initiation de paiement, oubli de mot de passe, reprises de notification et contenu non publié. Le test HTTP Docker contrôle Nginx, les routes API, PostgreSQL après migrations, le refus d’une connexion invalide et les assets statiques.

Lors des vérifications locales du 4 octobre 2026, neuf tests backend, la compilation, le lint, le formatage, les migrations et le smoke Docker ont réussi. Le build Vercel et la présence de Prisma/migrations dans l’image Render ont aussi été vérifiés. Ce constat ne remplace pas une exécution sur un nouveau commit ou dans les comptes d’hébergement.

### Vérifications fonctionnelles complémentaires

- Inscription, e-mail de vérification, connexion, réinitialisation et déconnexion.
- Panier invité, fusion à la connexion, changement de taille et stock insuffisant.
- Réservation complète, expiration, annulation autorisée/refusée et contrôle QR.
- Commande et réservation payées en sandbox, notification dupliquée et échec prestataire.
- Droits CUSTOMER, STAFF et ADMIN, y compris accès direct aux endpoints.
- Import Cloudinary, réception d’un e-mail et d’une notification WhatsApp.
- Rendu mobile, clavier, focus, libellés et erreurs de formulaires.
- Sauvegarde/restauration de la base et déploiement d’une migration sur staging.

La CI actuelle ne réalise pas ces parcours complets dans un navigateur et ne teste pas un encaissement réel.

## Exploitation et dépannage

### Santé, logs et arrêts

`/api/health` indique que le serveur répond. `/api/ready` exécute une requête PostgreSQL et renvoie `503` si la base est inaccessible. Aucun de ces endpoints ne garantit le bon fonctionnement de PayDunya, Resend, WhatsApp ou Cloudinary.

L’API émet des logs JSON : démarrage, méthode/chemin HTTP, statut, durée et événements d’erreur. Les détails internes ne sont pas renvoyés au client. Sur `SIGINT` ou `SIGTERM`, le serveur arrête sa minuterie, ferme les connexions HTTP puis Prisma, avec un délai de garde.

```bash
docker compose ps
docker compose logs --tail=100 api web migrate
```

Sur Render et Vercel, consulter les logs de build et d’exécution dans chaque projet. Vérifier séparément santé backend, proxy frontend, base et prestataire concerné.

### Sauvegardes et mises à jour

Prévoir sauvegardes PostgreSQL, rétention et essais de restauration. Ne pas utiliser les données réelles dans la pile de test temporaire. Conserver les migrations dans Git et tester leur compatibilité avant mise en production. Les médias importés dépendent aussi du compte Cloudinary et de sa conservation des ressources.

Mettre à jour les dépendances, images de base et actions GitHub avec validation des tests. Ne pas appliquer `npm audit fix --force` sans examiner les changements majeurs. Garder une procédure de retour applicatif compatible avec le schéma déjà déployé.

### Problèmes fréquents

| Symptôme                                      | Vérifications                                                                                   |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `Configuration invalide`                      | Variables nommées dans l’erreur, URL PostgreSQL, longueur du secret, mode de paiement           |
| API arrêtée au démarrage                      | Accès DB, SSL, réseau, secrets Render, logs `startup_failed`                                    |
| Tables inexistantes                           | Appliquer les migrations sur la bonne base avec la bonne `DIRECT_URL`                           |
| Contrats partagés introuvables                | Installer à la racine puis compiler `@neneen/contracts`                                         |
| Frontend incapable de joindre l’API           | Proxy Vite/Nginx/Vercel, adresse Render et `/api/ready`                                         |
| Build Vercel refusé                           | `RENDER_API_ORIGIN` HTTPS sans `/api`, racine du dépôt et preset Other                          |
| Connexion perdue après 15 minutes             | Cookie refresh, HTTPS, proxy `/api`, domaine et réponses de `/auth/refresh`                     |
| Paiements boutique désactivés                 | `PAYMENT_MODE`, trois clés PayDunya et `/payments/config` ; `paymentsLive` seul ne suffit pas   |
| Paiement effectué, commande encore en attente | Callback public, signature, confirmation serveur, montant et logs du paiement                   |
| Image impossible à importer                   | Les trois variables Cloudinary et la signature d’import                                         |
| Pas d’e-mail ou de WhatsApp                   | Identifiants, expéditeur/modèle, file `Notification`, tentatives et processus actif             |
| Mauvais contact public après modification     | Variables de build, valeurs de repli dans les composants et nouveau déploiement frontend        |
| Trop de visiteurs limités ensemble            | Configuration du proxy et adresse IP reçue par Express                                          |
| Docker local en HTTP, refresh absent          | Le cookie est `Secure` en production ; tester les sessions avec HTTPS ou en développement local |
| Tests locaux avec `EPERM` réseau              | Environnement d’exécution restreint ; les tests HTTP nécessitent un port local autorisé         |

## Limites connues

- **Déploiement externe :** les fichiers Render/Vercel sont prêts, mais les URL, secrets, protections GitHub et tests sur les plateformes doivent être vérifiés dans les comptes concernés.
- **Paiements distincts :** la boutique propose deux moyens, mais les réservations et contrats backend conservent carte/espèces et les anciens champs de livraison. Leur suppression globale demanderait une évolution supplémentaire.
- **Administration :** la vue Paiements existe et `/admin/payments` est implémenté, mais le mapping de `chargerVueAdmin` ne contient actuellement pas l’entrée `payments` et retombe sur le dashboard. Vérifier/corriger ce raccordement avant de considérer cette vue opérationnelle.
- **Paramètres publics :** `SiteSettings` ne remplace pas encore toutes les variables et valeurs de repli des pages. Certains liens WhatsApp produit ont un numéro de démonstration et certains liens sociaux sont génériques : remplacer ces valeurs avant publication.
- **Remboursements :** suivi interne et confirmation manuelle ; pas d’exécution automatique du remboursement chez le prestataire.
- **Newsletter :** l’inscription est enregistrée ; cela ne constitue pas une plateforme de campagnes ni un parcours complet de confirmation/désinscription exposé par les routes actuelles.
- **Tâches de fond :** exécutées dans le processus web, sans ordonnanceur externe dédié ; contrôler le fonctionnement si l’hébergement suspend le service ou si plusieurs instances sont lancées.
- **Contenus légaux :** les données de démonstration ne constituent pas les mentions et CGV finales. Renseigner identité, contacts et conditions de l’activité.
- **SEO :** navigation par fragments, sans pré-rendu des pages internes. Aligner le sitemap et robots sur le vrai domaine ; un SEO complet nécessite une évolution du routage/rendu.
- **Dépendances :** l’audit réalisé précédemment signale trois entrées élevées dans la chaîne Prisma → `@prisma/config` → `deepmerge-ts`. Voir le suivi dans [DEPLOYMENT.md](docs/DEPLOYMENT.md) ; l’état doit être réévalué après toute mise à jour.
- **Performance :** le build signale un bundle frontend supérieur à 500 ko avant compression. Le découpage par page reste une amélioration possible.
- **Couverture :** builds et tests réussis ne prouvent ni l’absence de vulnérabilités ni la validation des prestataires en production.

## Contribuer et faire évoluer le projet

1. Créer une branche et utiliser une base de développement isolée.
2. Placer la logique dans le domaine concerné plutôt que dans le routeur ou `App.tsx`.
3. Mettre à jour les contrats partagés lorsque le format public change et reconstruire leur package.
4. Versionner une migration si le schéma change ; ne pas modifier une migration déjà appliquée sur une base partagée.
5. Maintenir les autorisations côté serveur et les calculs de prix/stock dans le backend.
6. Ajouter des tests pour les règles métier modifiées et les régressions identifiées.
7. Exécuter lint, formatage, tests et build, puis le smoke Docker si le déploiement ou les connexions changent.
8. Actualiser les routes documentées, exemples d’environnement et instructions de déploiement.

Aucun secret ni export de données personnelles ne doit être ajouté aux commits. Les fichiers générés `dist`, `node_modules` et `.vercel` ne sont pas des sources à versionner.

## Documents de référence

- [Guide Docker, Render, Vercel et CI/CD](docs/DEPLOYMENT.md).
- [Notes historiques de réalisation](docs/IMPLEMENTATION.md) : certains comportements décrits sont antérieurs au checkout actuel ; comparer au code et à ce README.
- [Spécification OpenAPI](backend/openapi.yaml).
- [Contrats de validation](shared/contracts/src/index.ts).
- [Schéma de données](backend/prisma/schema.prisma).
- [Configuration backend](backend/.env.example) et [configuration frontend](frontend/.env.example).
- [Workflow GitHub Actions](.github/workflows/ci.yml).
- [Blueprint Render](render.yaml), [configuration Vercel](vercel.json) et [génération du build Vercel](scripts/build-vercel.mjs).
