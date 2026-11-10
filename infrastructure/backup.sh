#!/usr/bin/env bash
# ==============================================================================
# Cineverse Zero-Budget PostgreSQL Backup Script
# Usage: ./infrastructure/backup.sh [CONTAINER_NAME] [DB_USER] [DB_NAME]
# ==============================================================================

set -euo pipefail

CONTAINER_NAME="${1:-cineverse_postgres}"
DB_USER="${2:-postgres}"
DB_NAME="${3:-cineverse}"

BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_${TIMESTAMP}.sql.gz"

mkdir -p "${BACKUP_DIR}"

echo "==> Starting backup of database '${DB_NAME}' from container '${CONTAINER_NAME}'..."

if ! docker ps -q --filter "name=${CONTAINER_NAME}" | grep -q .; then
  echo "Error: Docker container '${CONTAINER_NAME}' is not running." >&2
  exit 1
fi

docker exec -t "${CONTAINER_NAME}" pg_dump -U "${DB_USER}" -d "${DB_NAME}" --clean --if-exists | gzip > "${BACKUP_FILE}"

FILE_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
echo "==> Backup completed successfully!"
echo "    Archive: ${BACKUP_FILE} (${FILE_SIZE})"
