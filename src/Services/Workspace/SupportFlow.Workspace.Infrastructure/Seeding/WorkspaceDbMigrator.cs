using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using SupportFlow.Workspace.Infrastructure.Persistence;

namespace SupportFlow.Workspace.Infrastructure.Seeding;

public sealed class WorkspaceDbMigrator : IHostedService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<WorkspaceDbMigrator> _logger;

    public WorkspaceDbMigrator(IServiceScopeFactory scopeFactory, ILogger<WorkspaceDbMigrator> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    public async Task StartAsync(CancellationToken cancellationToken)
    {
        await using var scope = _scopeFactory.CreateAsyncScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<WorkspaceDbContext>();

        try
        {
            await dbContext.Database.MigrateAsync(cancellationToken);
        }
        catch (Exception migrateException)
        {
            _logger.LogWarning(migrateException, "MigrateAsync failed; attempting EnsureCreated for local development.");

            try
            {
                await dbContext.Database.EnsureCreatedAsync(cancellationToken);
            }
            catch (Exception ensureException)
            {
                _logger.LogWarning(
                    ensureException,
                    "Workspace DB setup failed. Run from Visual Studio Terminal: dotnet ef migrations add InitialWorkspaceSchema --project src/Services/Workspace/SupportFlow.Workspace.Infrastructure --startup-project src/Services/Workspace/SupportFlow.Workspace.Api && dotnet ef database update --project src/Services/Workspace/SupportFlow.Workspace.Infrastructure --startup-project src/Services/Workspace/SupportFlow.Workspace.Api");
            }
        }
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}
