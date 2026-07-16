# Seed dev config keys into local Redis (HSV-style config store)
# Run after: .\scripts\docker-up.ps1

$keys = @{
  "Tenant:ConnectionStringWithReplaceToken" = "Host=localhost;Port=5432;Database={{database_name}};Username=postgres;Password=postgres"
  "Tenant:Realms:CIS-SUPPORTFLOW_V1:NpgsqlDatabaseName" = "supportflow_dev_db"
  "Jwt:Secret" = "dev-jwt-secret-change-in-production-min-32-chars"
  "Jwt:Issuer" = "supportflow.app"
  "Jwt:Audience" = "supportflow.app"
  "Jwt:AccessTokenExpiryMinutes" = "15"
  "ConnectionStrings:Redis" = "localhost:6379"
}

Write-Host "Seeding Redis config keys..." -ForegroundColor Cyan

foreach ($entry in $keys.GetEnumerator()) {
  docker exec supportflow-redis redis-cli SET $entry.Key $entry.Value | Out-Null
  Write-Host "  SET $($entry.Key)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Verify Jwt:Secret:" -ForegroundColor Yellow
docker exec supportflow-redis redis-cli GET "Jwt:Secret"
Write-Host "Done." -ForegroundColor Green
