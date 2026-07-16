# SupportFlow — Start all local infrastructure (Postgres + Redis + MailHog)
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

Write-Host "Starting SupportFlow Docker services..." -ForegroundColor Cyan
docker compose up -d

Write-Host ""
Write-Host "Waiting for health checks..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

docker compose ps

Write-Host ""
Write-Host "=== Service URLs ===" -ForegroundColor Green
Write-Host "PostgreSQL : localhost:5432  (db=supportflow, user=postgres, pass=postgres)"
Write-Host "Redis      : localhost:6379  (Valkey-compatible — use in appsettings)"
Write-Host "MailHog UI : http://localhost:8025"
Write-Host ""
Write-Host "Test Redis:" -ForegroundColor Yellow
docker exec supportflow-redis redis-cli ping
