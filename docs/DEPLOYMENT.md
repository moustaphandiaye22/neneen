# Docker et GitHub Actions

## Exécution avec une base PostgreSQL externe

Configurer `backend/.env` à partir de `.env.example`. Ne pas utiliser les valeurs de
`tests/deployment/backend.env` en production. `DATABASE_URL` vise la base applicative,
`DIRECT_URL` sa connexion directe pour Prisma Migrate.

```bash
docker compose build --pull
docker compose up -d --wait --wait-timeout 120
curl --fail http://localhost:5173/api/ready
```

Compose applique les migrations avec le service `migrate`, puis démarre l’API et
Nginx. Un échec de migration bloque le démarrage de l’API. Aucune donnée de
démonstration ni compte administrateur n’est créé automatiquement. Sauvegarder la
base avant une mise à jour ; tester les migrations sur une copie avant production.

Le backend et Nginx tournent sans root. Seul Nginx expose un port sur l’hôte.
`/api/health` vérifie le processus ; `/api/ready` vérifie aussi la connexion PostgreSQL.
Le healthcheck ne vérifie pas les services externes (paiement, e-mail, stockage).

Pour un domaine public, terminer TLS sur un reverse proxy ou load balancer devant
Nginx, configurer `FRONTEND_URL` et `PUBLIC_API_URL` avec les URL HTTPS publiques.
`PUBLIC_API_URL` ne doit pas inclure `/api`. Le proxy Nginx remplace les en-têtes
forwarded venant du client et Express fait confiance à un seul saut dans Compose.
Avec un proxy supplémentaire, configurer explicitement la restitution de l’adresse
IP réelle dans Nginx pour éviter une limite de débit partagée entre visiteurs.
Ne pas publier directement le port de l’API avec `TRUST_PROXY_HOPS=1`.

`WEB_PORT` règle le port publié (5173 par défaut). Les variables publiques
`VITE_WHATSAPP_NUMBER` et `VITE_CONTACT_EMAIL` doivent être présentes au **build**
(shell ou fichier `.env` à la racine pour Compose). Elles ne sont pas des secrets.
Changer ces variables après le build ne modifie pas le JavaScript livré.

## Test isolé, sans accès à Neon

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

La base de test est temporaire (`tmpfs`), sans port publié. Le test vérifie le
frontend compilé, ses images, le cache des assets, les routes API, l’accès aux tables
créées par les migrations et le refus d’une connexion invalide. Il ne valide pas
une transaction PayDunya réelle ni le rendu visuel dans un navigateur.

## Pipeline GitHub Actions

Sur chaque push et pull request : installation verrouillée, génération Prisma,
lint, formatage, tests et compilation. Ensuite : construction des trois images,
migrations sur PostgreSQL isolé, démarrage avec healthchecks, test HTTP complet et
seconde application des migrations (idempotence). Nettoyage même après échec.

La CI prépare aussi le format de sortie Vercel avec une origine API fictive ; ce
build de contrôle ne déploie rien. La publication GHCR a été retirée : Render
construit le Dockerfile backend, Vercel construit les fichiers statiques du frontend.

## Production : Render + Vercel

### 1. Backend sur Render

Créer un Blueprint depuis le dépôt GitHub et le fichier `render.yaml` à la racine.
Le plan `starter` déclaré est **payant** et permet le pre-deploy des migrations.
Aucun service payant n’est créé par les changements de code seuls. Pour un service
gratuit, le pre-deploy n’est pas disponible : prévoir une procédure de migration
séparée avant chaque mise en ligne, sans mettre les secrets de base dans le build.

Le contexte Docker reste la racine du dépôt, pas `backend/`, car l’API dépend de
`shared/contracts` et du lockfile commun. La commande de pré-déploiement est
`npm run db:deploy` ; le démarrage utilise le CMD du Dockerfile. Les migrations et
la CLI Prisma sont incluses dans l’image finale. `/api/ready` est la route de santé.

Renseigner les variables Render :

| Variable         | Valeur                                                      |
| ---------------- | ----------------------------------------------------------- |
| `DATABASE_URL`   | URL PostgreSQL Neon, poolée possible, SSL activé            |
| `DIRECT_URL`     | URL Neon directe pour les migrations                        |
| `JWT_SECRET`     | Générée par le Blueprint ; garder une valeur stable ensuite |
| `FRONTEND_URL`   | Origine HTTPS du domaine Vercel final, sans slash final     |
| `PUBLIC_API_URL` | Origine HTTPS Render, sans `/api`                           |
| `PAYMENT_MODE`   | `disabled` jusqu’à configuration des clés PayDunya          |

Ajouter les clés Cloudinary, Resend et PayDunya dans Render selon les services
utilisés. Ne pas copier les secrets backend dans Vercel. Aucun seed automatique
n’est lancé. Vérifier `https://<service>.onrender.com/api/ready` après déploiement.

### 2. Frontend sur Vercel

Importer le même dépôt avec **Root Directory = racine du dépôt** et le preset
**Other**. Conserver les commandes de `vercel.json` ; ne pas imposer `frontend/`
comme racine et ne pas définir d’Output Directory personnalisé. Choisir Node.js 22.
Le script produit `.vercel/output` selon la Build Output API officielle.

Configurer les variables Vercel avant le build :

| Variable               | Valeur                                        |
| ---------------------- | --------------------------------------------- |
| `RENDER_API_ORIGIN`    | `https://<service>.onrender.com`, sans `/api` |
| `VITE_WHATSAPP_NUMBER` | Numéro public au format international         |
| `VITE_CONTACT_EMAIL`   | Adresse publique de contact                   |

Le script impose `VITE_API_URL=/api` et génère un proxy HTTPS vers Render. Cela
maintient les requêtes et le cookie de renouvellement sur le domaine du frontend,
sans passer les cookies en `SameSite=None`. Les clés backend ne sont jamais requises
pour ce build. Pour les previews, utiliser idéalement un backend et une base de
staging distincts via les variables d’environnement Preview.

Après la création du domaine Vercel, reporter son origine dans `FRONTEND_URL` sur
Render et redéployer le backend. Tester connexion, rechargement de page,
renouvellement de session, déconnexion et `/api/ready` depuis le domaine Vercel.
Le proxy Vercel ajoute un intermédiaire réseau : contrôler également les adresses
IP observées par le rate limiter en production avant de modifier la confiance proxy.

### 3. Déploiements automatiques

Render attend les checks GitHub grâce à `autoDeployTrigger: checksPass`. Vercel
utilise son intégration Git : previews sur les branches et production sur la
branche de production sélectionnée. **Vercel n’attend pas ce workflow par défaut.**
Protéger la branche de production contre les push directs et exiger les checks
`verify` et `containers` avant fusion pour bloquer le code non validé.

Aucun token Render/Vercel n’est nécessaire dans GitHub pour ces intégrations natives.
La configuration des projets et de la protection de branche reste à réaliser dans
les comptes concernés. La CI et le build local ne prouvent pas que ces réglages
externes sont actifs. Un retour arrière du code ne restaure pas la base : garder
des sauvegardes et vérifier la compatibilité des migrations.

Références : [Blueprint Render](https://render.com/docs/blueprint-spec),
[Build Output API Vercel](https://vercel.com/docs/build-output-api).

## Résultat de la vérification du 4 octobre 2026

- Compilation complète, lint et formatage : réussis.
- Tests backend : 9 réussis.
- Images API, migration et frontend : construites et démarrées localement.
- Six migrations sur base vierge, puis seconde exécution sans migration restante.
- Smoke HTTP : Nginx, API, PostgreSQL, authentification et assets validés.
- Syntaxe du workflow : validée avec actionlint.
- Exécution GitHub et déploiements Render/Vercel : non exécutés pendant cette vérification.

`npm audit --omit=dev` remonte trois entrées de sévérité haute dans la chaîne
Prisma → @prisma/config → deepmerge-ts, correspondant à
[GHSA-ggr8-5vv4-36mx](https://github.com/advisories/GHSA-ggr8-5vv4-36mx).
L’avis concerne des objets récursifs ; sa présence dans les dépendances ne démontre
pas une exploitation via les routes de cette application. Aucune mise à niveau
majeure ou rétrogradation forcée de Prisma n’a été effectuée. Cette alerte reste à
traiter séparément avec validation de compatibilité.
