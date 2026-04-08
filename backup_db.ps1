$ErrorActionPreference = "Stop"

# Configuration
$dbName = "cricket_db"
$dbUser = "root"
$dbPassword = "Raghav@24"
$backupDir = "C:\backups\cricket_db"
$dateStamp = (Get-Date).ToString("yyyy_MM_dd_HHmmss")
$backupFile = "$backupDir\${dbName}_backup_${dateStamp}.sql"
$retentionDays = 7

# Ensure backup directory exists
if (!(Test-Path -Path $backupDir)) {
    New-Item -ItemType Directory -Force -Path $backupDir | Out-Null
    Write-Host "Created backup directory: $backupDir"
}

Write-Host "Starting backup for database '$dbName'..."

# Execute mysqldump
# Requires mysqldump to be in the system PATH
$dumpCommand = "mysqldump -u $dbUser -p`"$dbPassword`" $dbName > `"$backupFile`""
cmd.exe /c $dumpCommand

if ($LASTEXITCODE -eq 0) {
    Write-Host "Backup completed successfully! Saved to: $backupFile"
} else {
    Write-Error "Backup failed!"
}

# Apply retention policy: Cleanup old backups
Write-Host "Cleaning up backups older than $retentionDays days..."
$cutoffDate = (Get-Date).AddDays(-$retentionDays)
Get-ChildItem -Path $backupDir -Filter "*.sql" | Where-Object { $_.CreationTime -lt $cutoffDate } | Remove-Item -Force
Write-Host "Cleanup finished."
