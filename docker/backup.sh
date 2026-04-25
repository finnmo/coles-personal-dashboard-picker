#!/bin/sh
set -e

DB_PATH="${DB_PATH:-/app/data/dashboard.db}"
BACKUP_DIR="${BACKUP_DIR:-/app/data/backups}"
DAILY_DIR="${BACKUP_DIR}/daily"
WEEKLY_DIR="${BACKUP_DIR}/weekly"

mkdir -p "$DAILY_DIR" "$WEEKLY_DIR"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DAILY_FILE="${DAILY_DIR}/dashboard_${TIMESTAMP}.db"

# Use sqlite3 online backup API (safe for concurrent access)
sqlite3 "$DB_PATH" ".backup '${DAILY_FILE}'"
echo "[backup] Daily backup written: ${DAILY_FILE}"

# Weekly backup on Sundays (DOW=7)
DOW=$(date +%u)
if [ "$DOW" = "7" ]; then
  WEEKLY_FILE="${WEEKLY_DIR}/dashboard_${TIMESTAMP}.db"
  cp "$DAILY_FILE" "$WEEKLY_FILE"
  echo "[backup] Weekly backup written: ${WEEKLY_FILE}"
fi

# Rotation: keep last 7 daily backups
DAILY_COUNT=$(ls -1 "${DAILY_DIR}"/*.db 2>/dev/null | wc -l)
if [ "$DAILY_COUNT" -gt 7 ]; then
  ls -1t "${DAILY_DIR}"/*.db | tail -n +"$((7 + 1))" | xargs rm -f
  echo "[backup] Rotated daily backups (kept 7)"
fi

# Rotation: keep last 4 weekly backups
WEEKLY_COUNT=$(ls -1 "${WEEKLY_DIR}"/*.db 2>/dev/null | wc -l)
if [ "$WEEKLY_COUNT" -gt 4 ]; then
  ls -1t "${WEEKLY_DIR}"/*.db | tail -n +"$((4 + 1))" | xargs rm -f
  echo "[backup] Rotated weekly backups (kept 4)"
fi
