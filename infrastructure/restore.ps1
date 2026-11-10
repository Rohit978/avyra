<#
.SYNOPSIS
  Cineverse Zero-Budget PostgreSQL Restore Script for PowerShell
.DESCRIPTION
  Restores database snapshot into running Docker container.
.EXAMPLE
  .\infrastructure\restore.ps1 -BackupFile ".\backups\cineverse_20261111_041500.sql"
#>
param(
    [Parameter(Mandatory=$true)]
    [string]$BackupFile,
    [string]$ContainerName = "cineverse_postgres",
    [string]$DbUser = "postgres",
    [string]$DbName = "cineverse"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $BackupFile)) {
    Write-Error "Backup file '$BackupFile' does not exist."
    exit 1
}

Write-Host "==> Restoring database '$DbName' from '$BackupFile' into '$ContainerName'..." -ForegroundColor Cyan

# Check container running
$ContainerRunning = docker ps -q --filter "name=$ContainerName"
if (-not $ContainerRunning) {
    Write-Error "Docker container '$ContainerName' is not running."
    exit 1
}

Get-Content $BackupFile | docker exec -i $ContainerName psql -U $DbUser -d $DbName

Write-Host "==> Database restore completed successfully!" -ForegroundColor Green
