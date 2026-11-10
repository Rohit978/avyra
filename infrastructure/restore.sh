#!/usr/bin/env bash
# ==============================================================================
# Cineverse Zero-Budget PostgreSQL Restore Script
# Usage: ./infrastructure/restore.sh <BACKUP_FILE.sql.gz> [CONTAINER_NAME] [DB_USER] [DB_NAME]
# ==============================================================================

set -euo pipefail

BACKUP_FILE="${1:-}"
CONTAINER_NAME="${2:-cineverse_postgres}"
DB_USER="${3:-postgres}"
DB_NAME="${4:-cineverse}"

if [ -z "${BACKUP_FILE}" ] || [ ! -f "${BACKUP_FILE}" ]; then
  echo "Usage: $0 <path_to_backup_file> [container_name] [db_user] [db_name]" >&2
  exit 1
fi

echo "==> Restoring database '${DB_NAME}' from '${BACKUP_FILE}' into container '${CONTAINER_NAME}'..."

if ! docker ps -q --filter "name=${CONTAINER_NAME}" | grep -q .; then
  echo "Error: Docker container '${CONTAINER_NAME}' is not running." >&2
  exit 1
fi

if [[ "${BACKUP_FILE}" == *.gz ]]; then
  gunzip -c "${BACKUP_FILE}" | docker exec -i "${CONTAINER_NAME}" psql -U "${DB_USER}" -d "${DB_NAME}"
else
  cat "${BACKUP_FILE}" | docker exec -i "${CONTAINER_NAME}" psql -U "${DB_USER}" -d "${DB_NAME}"
fi

echo "==> Database restore completed successfully!"
