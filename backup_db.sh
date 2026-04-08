#!/bin/bash

# Configuration
DB_NAME="cricket_db"
DB_USER="root"
DB_PASS="Raghav@24"
BACKUP_DIR="/var/backups/cricket_db"
DATE=$(date +"%Y_%m_%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_backup_${DATE}.sql"
RETENTION_DAYS=7

# Ensure backup directory exists
mkdir -p "$BACKUP_DIR"

echo "Starting backup for database '$DB_NAME'..."

# Execute mysqldump
mysqldump --set-gtid-purged=OFF -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "Backup completed successfully! Saved to: $BACKUP_FILE"
else
    echo "Backup failed!"
    exit 1
fi

# Apply retention policy: Cleanup old backups
echo "Cleaning up backups older than $RETENTION_DAYS days..."
find "$BACKUP_DIR" -type f -name "*.sql" -mtime +$RETENTION_DAYS -exec rm {} \;
echo "Cleanup finished."
