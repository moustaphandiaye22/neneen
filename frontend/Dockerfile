FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package*.json ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json
COPY shared/contracts/package.json shared/contracts/package.json
RUN npm ci
COPY frontend frontend
COPY shared/contracts shared/contracts
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL
RUN npm --workspace @neneen/contracts run build && npm --prefix frontend run build
FROM nginx:stable-alpine
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/frontend/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 CMD wget -q -O /dev/null http://127.0.0.1/ || exit 1
