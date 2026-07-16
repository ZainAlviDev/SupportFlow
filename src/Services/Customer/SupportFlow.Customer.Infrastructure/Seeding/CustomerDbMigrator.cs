using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using SupportFlow.Customer.Infrastructure.Persistence;

namespace SupportFlow.Customer.Infrastructure.Seeding;

public sealed class CustomerDbMigrator : IHostedService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<CustomerDbMigrator> _logger;

    public CustomerDbMigrator(IServiceScopeFactory scopeFactory, ILogger<CustomerDbMigrator> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    public async Task StartAsync(CancellationToken cancellationToken)
    {
        await using var scope = _scopeFactory.CreateAsyncScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<CustomerDbContext>();

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
                    "Customer DB setup failed. Run: dotnet ef migrations add InitialCustomerSchema --project src/Services/Customer/SupportFlow.Customer.Infrastructure --startup-project src/Services/Customer/SupportFlow.Customer.Api");
            }
        }
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}
