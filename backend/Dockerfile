FROM node:22-bookworm-slim AS build
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json
COPY shared/contracts/package.json shared/contracts/package.json
RUN npm ci --workspace neneen-backend --workspace @neneen/contracts --include-workspace-root=false
COPY backend backend
COPY shared/contracts shared/contracts
RUN npm --workspace @neneen/contracts run build && npm --prefix backend run build

# One-off migration image: never seed or reset a production database at startup.
FROM build AS migrate
WORKDIR /app/backend
USER node
CMD ["../node_modules/.bin/prisma", "migrate", "deploy"]

FROM build AS production-dependencies
RUN npm prune --omit=dev --ignore-scripts --workspace neneen-backend --workspace @neneen/contracts --include-workspace-root=false

FROM node:22-bookworm-slim AS runtime
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app/backend
ENV NODE_ENV=production
COPY --from=production-dependencies /app/node_modules /app/node_modules
COPY --from=production-dependencies /app/backend/node_modules /app/backend/node_modules
COPY --from=build /app/package.json /app/package.json
COPY --from=build /app/backend/package.json /app/backend/package.json
COPY --from=build /app/backend/dist /app/backend/dist
COPY --from=build /app/backend/prisma /app/backend/prisma
COPY --from=build /app/backend/openapi.yaml /app/backend/openapi.yaml
COPY --from=build /app/shared/contracts/package.json /app/shared/contracts/package.json
COPY --from=build /app/shared/contracts/dist /app/shared/contracts/dist
USER node
EXPOSE 4000
HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=3 CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||4000)+'/api/ready').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "dist/src/index.js"]
