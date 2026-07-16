# Start all SupportFlow microservices + gateway (development)
$root = Split-Path -Parent $PSScriptRoot
$services = @(
  @{ Project = "src\Gateway\SupportFlow.Gateway\SupportFlow.Gateway.csproj"; Name = "Gateway" },
  @{ Project = "src\Services\Identity\SupportFlow.Identity.Api\SupportFlow.Identity.Api.csproj"; Name = "Identity" },
  @{ Project = "src\Services\Workspace\SupportFlow.Workspace.Api\SupportFlow.Workspace.Api.csproj"; Name = "Workspace" },
  @{ Project = "src\Services\Conversation\SupportFlow.Conversation.Api\SupportFlow.Conversation.Api.csproj"; Name = "Conversation" },
  @{ Project = "src\Services\Ticket\SupportFlow.Ticket.Api\SupportFlow.Ticket.Api.csproj"; Name = "Ticket" },
  @{ Project = "src\Services\Customer\SupportFlow.Customer.Api\SupportFlow.Customer.Api.csproj"; Name = "Customer" },
  @{ Project = "src\Services\Knowledge\SupportFlow.Knowledge.Api\SupportFlow.Knowledge.Api.csproj"; Name = "Knowledge" },
  @{ Project = "src\Services\AI\SupportFlow.AI.Api\SupportFlow.AI.Api.csproj"; Name = "AI" },
  @{ Project = "src\Services\Notification\SupportFlow.Notification.Api\SupportFlow.Notification.Api.csproj"; Name = "Notification" }
)

Write-Host "Starting SupportFlow services..." -ForegroundColor Cyan
foreach ($svc in $services) {
  $path = Join-Path $root $svc.Project
  Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root'; Write-Host '$($svc.Name) API' -ForegroundColor Green; dotnet run --project '$path'" -WindowStyle Minimized
  Start-Sleep -Seconds 2
}

Write-Host ""
Write-Host "Gateway:  http://localhost:5000/health" -ForegroundColor Yellow
Write-Host "Identity: http://localhost:5010/health" -ForegroundColor Yellow
Write-Host "Done. Check gateway /health for all services status." -ForegroundColor Green
