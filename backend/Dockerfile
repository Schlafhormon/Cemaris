# syntax=docker/dockerfile:1
FROM ghcr.io/astral-sh/uv:0.13.1 AS uv
FROM node:24.19.0-bookworm-slim@sha256:a9f5f7c91a432850b2a8a7797adf5eadb6c733ceed61167806cee7ea7fbc29df AS node
FROM python:3.14.2-slim-bookworm@sha256:e87711ef5c86aaeaa7031718a69db79d334d94c545c709583f651b8185870941

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    UV_PYTHON_DOWNLOADS=never

# Microsoft ODBC Driver 18 and the Unix ODBC runtime for pyodbc.
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl ca-certificates tzdata \
    && curl -fsSLo /tmp/packages-microsoft-prod.deb https://packages.microsoft.com/config/debian/12/packages-microsoft-prod.deb \
    && dpkg -i /tmp/packages-microsoft-prod.deb \
    && apt-get update \
    && ACCEPT_EULA=Y apt-get install -y --no-install-recommends msodbcsql18=18.7.1.1-1 unixodbc libgssapi-krb5-2 chromium fonts-liberation \
    && rm -rf /var/lib/apt/lists/* /tmp/packages-microsoft-prod.deb \
    && groupadd --gid 10001 cemaris \
    && useradd --uid 10001 --gid 10001 --create-home cemaris

COPY --from=uv /uv /usr/local/bin/uv
COPY --from=node /usr/local/bin/node /usr/local/bin/node
COPY --from=node /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/npm
RUN ln -s ../lib/node_modules/npm/bin/npm-cli.js /usr/local/bin/npm
WORKDIR /app
COPY backend/pyproject.toml backend/uv.lock backend/.python-version ./
RUN uv sync --locked --no-dev
COPY backend/printing-runtime/package.json backend/printing-runtime/package-lock.json ./printing-runtime/
RUN npm ci --prefix printing-runtime --omit=dev
COPY backend/printing-runtime ./printing-runtime
COPY backend/cemaris ./cemaris
COPY backend/manage.py ./manage.py
COPY backend/alembic.ini ./alembic.ini
COPY backend/migrations ./migrations
COPY deploy/readiness.py deploy/migrate.py deploy/start.py ./deploy/
COPY THIRD_PARTY_NOTICES.md ./
COPY licenses ./licenses
ENV CEMARIS_PRINT_BROWSER_EXECUTABLE=/usr/bin/chromium
RUN mkdir -p /app/data/sessions /app/data/attachments && chown -R cemaris:cemaris /app/data
USER cemaris
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=50s --start-period=20s --retries=3 \
    CMD ["/app/.venv/bin/python", "/app/deploy/readiness.py", "--http"]
CMD ["/app/.venv/bin/python", "/app/deploy/start.py"]
