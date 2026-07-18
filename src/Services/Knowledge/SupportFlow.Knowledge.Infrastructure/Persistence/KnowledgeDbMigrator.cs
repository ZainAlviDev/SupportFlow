using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace SupportFlow.Knowledge.Infrastructure.Persistence;

public sealed class KnowledgeDbMigrator : IHostedService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<KnowledgeDbMigrator> _logger;

    public KnowledgeDbMigrator(
        IServiceScopeFactory scopeFactory,
        ILogger<KnowledgeDbMigrator> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    public async Task StartAsync(CancellationToken cancellationToken)
    {
        await using var scope = _scopeFactory.CreateAsyncScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<KnowledgeDbContext>();

        _logger.LogInformation("Applying Knowledge database migrations.");
        await dbContext.Database.MigrateAsync(cancellationToken);
        _logger.LogInformation("Knowledge database migrations applied.");
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}
