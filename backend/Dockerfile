FROM node:22-bookworm-slim AS build
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json
COPY shared/contracts/package.json shared/contracts/package.json
RUN npm ci
COPY backend backend
COPY shared/contracts shared/contracts
ENV DATABASE_URL=postgresql://user:password@localhost:5432/neneen \
    DIRECT_URL=postgresql://user:password@localhost:5432/neneen \
    JWT_SECRET=build-only-dummy-secret-with-at-least-32-characters
RUN npm --workspace @neneen/contracts run build && npm --prefix backend run build
RUN npm prune --omit=dev --ignore-scripts
FROM node:22-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app/backend
ENV NODE_ENV=production
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/package.json /app/package.json
COPY --from=build /app/backend/package.json /app/backend/package.json
COPY --from=build /app/backend/dist /app/backend/dist
COPY --from=build /app/backend/openapi.yaml /app/backend/openapi.yaml
COPY --from=build /app/shared/contracts/package.json /app/shared/contracts/package.json
COPY --from=build /app/shared/contracts/dist /app/shared/contracts/dist
USER node
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 CMD node -e "fetch('http://127.0.0.1:4000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "dist/src/index.js"]
