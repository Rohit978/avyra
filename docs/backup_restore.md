# Disaster Recovery & Database Backup Runbook (₹0 Budget)

This runbook documents operational backup, verification, and restore procedures for the Cineverse PostgreSQL database.

---

## 1. Automated & Manual Backups

### Linux / macOS (Bash)
```bash
# Make script executable
chmod +x infrastructure/backup.sh

# Run manual backup
./infrastructure/backup.sh
```
This produces a compressed gzip snapshot in `./backups/cineverse_YYYYMMDD_HHMMSS.sql.gz`.

### Windows (PowerShell)
```powershell
.\infrastructure\backup.ps1
```
This produces a snapshot in `.\backups\cineverse_YYYYMMDD_HHMMSS.sql`.

### Scheduling Automated Daily Backups
Add a cron job on your Linux host:
```cron
# Run daily at 03:00 AM
0 3 * * * cd /path/to/CineVines && ./infrastructure/backup.sh >> /var/log/cineverse_backup.log 2>&1
```

---

## 2. Database Restore & Disaster Recovery

### Step 1: Ensure PostgreSQL Container is Running
```bash
docker compose -f infrastructure/docker-compose.yml up -d
```

### Step 2: Execute Restore

**Linux / macOS:**
```bash
./infrastructure/restore.sh ./backups/cineverse_YYYYMMDD_HHMMSS.sql.gz
```

**Windows (PowerShell):**
```powershell
.\infrastructure\restore.ps1 -BackupFile ".\backups\cineverse_YYYYMMDD_HHMMSS.sql"
```

### Step 3: Run Database Migrations
Verify the schema is at head:
```bash
cd backend
alembic upgrade head
```

---

## 3. Snapshot Verification & Integrity Tests
To test a backup snapshot in an isolated temporary container:
```bash
docker run --name cineverse_verify_test -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=cineverse_test -d postgres:15-alpine
sleep 5
cat ./backups/latest.sql | docker exec -i cineverse_verify_test psql -U postgres -d cineverse_test
docker exec -it cineverse_verify_test psql -U postgres -d cineverse_test -c "SELECT count(*) FROM media;"
docker rm -f cineverse_verify_test
```
