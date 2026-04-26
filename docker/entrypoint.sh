#!/bin/sh
set -e

# ─── Data directory ─────────────────────────────────────────────────────────────
mkdir -p /app/data
chown -R nextjs:nodejs /app/data

# ─── DATABASE_URL default ────────────────────────────────────────────────────────
# Always stored in the mounted data volume. Users never need to set this.
if [ -z "$DATABASE_URL" ]; then
  DATABASE_URL="file:/app/data/dashboard.db"
  export DATABASE_URL
fi

# ─── Database migrations ─────────────────────────────────────────────────────────
echo "[setup] Running database migrations..."
su-exec nextjs node node_modules/prisma/build/index.js migrate deploy

# ─── Start application ───────────────────────────────────────────────────────────
echo "[setup] Starting application..."
exec su-exec nextjs node server.js
