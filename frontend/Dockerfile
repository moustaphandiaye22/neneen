FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package*.json ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json
COPY shared/contracts/package.json shared/contracts/package.json
RUN npm ci --workspace frontend --workspace @neneen/contracts --include-workspace-root=false
COPY frontend frontend
COPY shared/contracts shared/contracts
ARG VITE_API_URL=/api
ARG VITE_WHATSAPP_NUMBER=""
ARG VITE_CONTACT_EMAIL=""
ENV VITE_API_URL=$VITE_API_URL \
    VITE_WHATSAPP_NUMBER=$VITE_WHATSAPP_NUMBER \
    VITE_CONTACT_EMAIL=$VITE_CONTACT_EMAIL
RUN npm --workspace @neneen/contracts run build && npm --prefix frontend run build
FROM nginxinc/nginx-unprivileged:stable-alpine AS runtime
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/frontend/dist /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 CMD wget -q -O /dev/null http://127.0.0.1:8080/healthz || exit 1
