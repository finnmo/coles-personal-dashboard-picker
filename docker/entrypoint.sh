#!/bin/sh
set -e

# ─── Data directory ─────────────────────────────────────────────────────────────
mkdir -p /app/data
chown -R nextjs:nodejs /app/data

# ─── SESSION_SECRET auto-generation ─────────────────────────────────────────────
# If SESSION_SECRET is blank, load from persisted file or generate a new one.
SECRET_FILE="/app/data/.session_secret"
if [ -z "$SESSION_SECRET" ]; then
  if [ -f "$SECRET_FILE" ]; then
    SESSION_SECRET=$(cat "$SECRET_FILE")
    echo "[setup] Loaded SESSION_SECRET from persisted file"
  else
    SESSION_SECRET=$(node -e "process.stdout.write(require('crypto').randomBytes(32).toString('hex'))")
    printf '%s' "$SESSION_SECRET" > "$SECRET_FILE"
    chmod 600 "$SECRET_FILE"
    chown nextjs:nodejs "$SECRET_FILE"
    echo "[setup] Generated and persisted new SESSION_SECRET"
  fi
  export SESSION_SECRET
fi

# ─── SETUP_PASSWORD → APP_PASSWORD_HASH ─────────────────────────────────────────
# On first run, if APP_PASSWORD_HASH is blank but SETUP_PASSWORD is provided,
# compute the bcrypt hash and persist it so restarts don't re-hash.
HASH_FILE="/app/data/.password_hash"
if [ -z "$APP_PASSWORD_HASH" ]; then
  if [ -f "$HASH_FILE" ]; then
    APP_PASSWORD_HASH=$(cat "$HASH_FILE")
    echo "[setup] Loaded APP_PASSWORD_HASH from persisted file"
    export APP_PASSWORD_HASH
  elif [ -n "$SETUP_PASSWORD" ]; then
    echo "[setup] Generating bcrypt hash from SETUP_PASSWORD..."
    APP_PASSWORD_HASH=$(node -e "
const b = require('./node_modules/bcryptjs');
b.hash(process.env.SETUP_PASSWORD, 10).then(h => {
  process.stdout.write(h);
  process.exit(0);
});
")
    printf '%s' "$APP_PASSWORD_HASH" > "$HASH_FILE"
    chmod 600 "$HASH_FILE"
    chown nextjs:nodejs "$HASH_FILE"
    export APP_PASSWORD_HASH
    echo "[setup] Password hash generated and persisted"
  else
    echo "[setup] WARNING: APP_PASSWORD_HASH and SETUP_PASSWORD are both unset — app will fail startup validation"
  fi
fi

# ─── Database migrations ─────────────────────────────────────────────────────────
echo "[setup] Running database migrations..."
su-exec nextjs node node_modules/prisma/build/index.js migrate deploy

# ─── Start application ───────────────────────────────────────────────────────────
echo "[setup] Starting application..."
exec su-exec nextjs node server.js
