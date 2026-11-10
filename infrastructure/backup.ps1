<#
.SYNOPSIS
  Cineverse Zero-Budget PostgreSQL Backup Script for PowerShell
.DESCRIPTION
  Dumps and compresses PostgreSQL database from running Docker container.
.EXAMPLE
  .\infrastructure\backup.ps1 -ContainerName "cineverse_postgres" -DbName "cineverse"
#>
param(
    [string]$ContainerName = "cineverse_postgres",
    [string]$DbUser = "postgres",
    [string]$DbName = "cineverse",
    [string]$BackupDir = ".\backups"
)

$ErrorActionPreference = "Stop"

if (!(Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Force -Path $BackupDir | Out-Null
}

$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupFile = Join-Path $BackupDir "$($DbName)_$($Timestamp).sql"

Write-Host "==> Starting backup of database '$DbName' from container '$ContainerName'..." -ForegroundColor Cyan

# Check container running
$ContainerRunning = docker ps -q --filter "name=$ContainerName"
if (-not $ContainerRunning) {
    Write-Error "Docker container '$ContainerName' is not running."
    exit 1
}

docker exec -t $ContainerName pg_dump -U $DbUser -d $DbName --clean --if-exists > $BackupFile

$FileSize = (Get-Item $BackupFile).Length / 1KB
Write-Host "==> Backup completed successfully!" -ForegroundColor Green
Write-Host "    Snapshot: $BackupFile ($([math]::Round($FileSize, 2)) KB)" -ForegroundColor Gray
