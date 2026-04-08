#!/bin/bash

# Configuration
DB_USER="root"
DB_PASS="Raghav@24" # Normally from env variable
DB_NAME="cricket_db"
BACKUP_DIR="/root/db_backups" # Better to use absolute path
DATE=$(date +"%Y-%m-%d_%H-%M-%S")
RETENTION_DAYS=7

# Ensure backup directory exists
mkdir -p "$BACKUP_DIR"

# Perform backup
mysqldump -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" > "$BACKUP_DIR/${DB_NAME}_backup_$DATE.sql"

if [ $? -eq 0 ]; then
    echo "Backup successful: ${DB_NAME}_backup_$DATE.sql"
    
    # Compress the latest backup to save space
    gzip "$BACKUP_DIR/${DB_NAME}_backup_$DATE.sql"
    
    # Prune old backups based on retention policy
    find "$BACKUP_DIR" -type f -name "*.sql.gz" -mtime +$RETENTION_DAYS -exec rm {} \;
    echo "Old backups cleaned up (retention: $RETENTION_DAYS days)"
else
    echo "Backup failed!"
    # Error alerting logic here (e.g., Slack webhook, email)
    exit 1
fi
