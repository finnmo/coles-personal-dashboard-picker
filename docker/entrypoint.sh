#!/bin/sh
set -e

# Ensure the data directory is writable by the nextjs user regardless of
# how the volume was originally created (root-owned volumes are common).
mkdir -p /app/data
chown -R nextjs:nodejs /app/data

echo "Running database migrations..."
su-exec nextjs node node_modules/prisma/build/index.js migrate deploy

echo "Starting application..."
exec su-exec nextjs node server.js
