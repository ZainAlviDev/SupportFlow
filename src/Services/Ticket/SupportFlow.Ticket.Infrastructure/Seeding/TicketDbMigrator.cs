using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using SupportFlow.Ticket.Infrastructure.Persistence;

namespace SupportFlow.Ticket.Infrastructure.Seeding;

public sealed class TicketDbMigrator : IHostedService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<TicketDbMigrator> _logger;

    public TicketDbMigrator(IServiceScopeFactory scopeFactory, ILogger<TicketDbMigrator> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    public async Task StartAsync(CancellationToken cancellationToken)
    {
        await using var scope = _scopeFactory.CreateAsyncScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<TicketDbContext>();

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
                    "Ticket DB setup failed. Run: dotnet ef migrations add InitialTicketSchema --project src/Services/Ticket/SupportFlow.Ticket.Infrastructure --startup-project src/Services/Ticket/SupportFlow.Ticket.Api");
            }
        }
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}
