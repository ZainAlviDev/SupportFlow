# Start only the services needed for login/register/workspace (Module 1)
$root = Split-Path -Parent $PSScriptRoot
$services = @(
  @{ Project = "src\Gateway\SupportFlow.Gateway\SupportFlow.Gateway.csproj"; Name = "Gateway (:5000)" },
  @{ Project = "src\Services\Identity\SupportFlow.Identity.Api\SupportFlow.Identity.Api.csproj"; Name = "Identity (:5010)" },
  @{ Project = "src\Services\Workspace\SupportFlow.Workspace.Api\SupportFlow.Workspace.Api.csproj"; Name = "Workspace (:5020)" }
)

Write-Host "Starting SupportFlow auth stack..." -ForegroundColor Cyan
foreach ($svc in $services) {
  $path = Join-Path $root $svc.Project
  Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root'; Write-Host '$($svc.Name)' -ForegroundColor Green; dotnet run --project '$path'"
  Start-Sleep -Seconds 2
}

Write-Host ""
Write-Host "Required for registration:" -ForegroundColor Yellow
Write-Host "  Gateway:   http://localhost:5000/health"
Write-Host "  Identity:  http://localhost:5010/health/live"
Write-Host "  Workspace: http://localhost:5020/health/live"
Write-Host ""
Write-Host "Then start dashboard:" -ForegroundColor Yellow
Write-Host "  cd web"
Write-Host "  npm run dev:dashboard"
Write-Host "  open http://localhost:3000/register"
