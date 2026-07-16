using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using SupportFlow.Conversation.Infrastructure.Persistence;

namespace SupportFlow.Conversation.Infrastructure.Seeding;

public sealed class ConversationDbMigrator : IHostedService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<ConversationDbMigrator> _logger;

    public ConversationDbMigrator(IServiceScopeFactory scopeFactory, ILogger<ConversationDbMigrator> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    public async Task StartAsync(CancellationToken cancellationToken)
    {
        await using var scope = _scopeFactory.CreateAsyncScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<ConversationDbContext>();

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
                    "Conversation DB setup failed. Run: dotnet ef migrations add InitialConversationSchema --project src/Services/Conversation/SupportFlow.Conversation.Infrastructure --startup-project src/Services/Conversation/SupportFlow.Conversation.Api");
            }
        }
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}
