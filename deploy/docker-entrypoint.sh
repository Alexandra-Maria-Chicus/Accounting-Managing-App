#!/bin/sh
set -e

echo "Waiting for Postgres to accept connections..."
until python -c "import os, psycopg2; psycopg2.connect(os.environ['DATABASE_URL'])" 2>/dev/null; do
  sleep 1
done

echo "Applying database migrations..."
alembic upgrade head

echo "Starting API (single worker — required for in-memory WebSocket managers)..."
exec uvicorn app.main:app \
  --host 0.0.0.0 \
  --port 8000 \
  --proxy-headers \
  --forwarded-allow-ips="*" \
  --workers 1
