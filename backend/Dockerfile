FROM node:22-bookworm-slim AS build
WORKDIR /app
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
FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app /app
USER node
EXPOSE 4000
CMD ["npm", "--prefix", "backend", "start"]
