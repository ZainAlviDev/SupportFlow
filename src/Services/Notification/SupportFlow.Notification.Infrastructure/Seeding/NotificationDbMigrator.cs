using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using SupportFlow.Notification.Infrastructure.Persistence;

namespace SupportFlow.Notification.Infrastructure.Seeding;

public sealed class NotificationDbMigrator : IHostedService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<NotificationDbMigrator> _logger;

    public NotificationDbMigrator(IServiceScopeFactory scopeFactory, ILogger<NotificationDbMigrator> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    public async Task StartAsync(CancellationToken cancellationToken)
    {
        await using var scope = _scopeFactory.CreateAsyncScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<NotificationDbContext>();

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
                    "Notification DB setup failed. Run: dotnet ef migrations add InitialNotificationSchema --project src/Services/Notification/SupportFlow.Notification.Infrastructure --startup-project src/Services/Notification/SupportFlow.Notification.Api");
            }
        }
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}
