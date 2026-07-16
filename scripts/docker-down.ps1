# SupportFlow — Stop all Docker services
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

Write-Host "Stopping SupportFlow Docker services..." -ForegroundColor Cyan
docker compose down
Write-Host "Done." -ForegroundColor Green
