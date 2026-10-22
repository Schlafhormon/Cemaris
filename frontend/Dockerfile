# syntax=docker/dockerfile:1
FROM node:24.19.0-bookworm-slim@sha256:a9f5f7c91a432850b2a8a7797adf5eadb6c733ceed61167806cee7ea7fbc29df AS build
WORKDIR /app
RUN npm install --global npm@11.17.0
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
ARG CEMARIS_URL_PREFIX=""
ENV CEMARIS_URL_PREFIX=${CEMARIS_URL_PREFIX}
RUN npm run build
COPY deploy/nginx.conf deploy/render-nginx.mjs ./deploy/
RUN node deploy/render-nginx.mjs deploy/nginx.conf /tmp/default.conf.template "$CEMARIS_URL_PREFIX"

FROM nginx:1.28.0-alpine@sha256:30f1c0d78e0ad60901648be663a710bdadf19e4c10ac6782c235200619158284
ENV CEMARIS_TRUSTED_PROXY_CIDR=127.0.0.1 \
    NGINX_ENVSUBST_FILTER=^CEMARIS_TRUSTED_PROXY_CIDR$
COPY --from=build /tmp/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
COPY THIRD_PARTY_NOTICES.md /usr/share/nginx/html/THIRD_PARTY_NOTICES.md
COPY licenses /usr/share/nginx/html/licenses
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -q -O /dev/null http://127.0.0.1:8080/healthz || exit 1
