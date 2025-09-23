#!/bin/bash

# MySQL backup script for i-Keeper
# Usage: ./backup.sh

BACKUP_DIR="/backup"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_NAME="ikeeper"
DB_USER="root"
DB_PASSWORD="${MYSQL_ROOT_PASSWORD}"
BACKUP_FILE="${BACKUP_DIR}/ikeeper_backup_${TIMESTAMP}.sql"

echo "Starting backup of ${DB_NAME} database..."

mysqldump -u${DB_USER} -p${DB_PASSWORD} ${DB_NAME} > ${BACKUP_FILE}

if [ $? -eq 0 ]; then
    echo "Backup completed successfully: ${BACKUP_FILE}"

    # Compress the backup
    gzip ${BACKUP_FILE}
    echo "Backup compressed: ${BACKUP_FILE}.gz"

    # Remove backups older than 30 days
    find ${BACKUP_DIR} -name "ikeeper_backup_*.sql.gz" -mtime +30 -delete
    echo "Old backups removed (older than 30 days)"
else
    echo "Backup failed!"
    exit 1
fi