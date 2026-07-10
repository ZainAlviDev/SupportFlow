using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using SupportFlow.Identity.Domain.Entities;
using SupportFlow.Identity.Domain.Enums;
using SupportFlow.Identity.Infrastructure.Persistence;
using SupportFlow.Shared.Kernel.Enums;

namespace SupportFlow.Identity.Infrastructure.Seeding;

public sealed class IdentityDataSeeder : IHostedService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IHostEnvironment _environment;
    private readonly ILogger<IdentityDataSeeder> _logger;

    public IdentityDataSeeder(
        IServiceScopeFactory scopeFactory,
        IHostEnvironment environment,
        ILogger<IdentityDataSeeder> logger)
    {
        _scopeFactory = scopeFactory;
        _environment = environment;
        _logger = logger;
    }

    public async Task StartAsync(CancellationToken cancellationToken)
    {
        if (!_environment.IsDevelopment())
        {
            return;
        }

        await using var scope = _scopeFactory.CreateAsyncScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<User>>();

        await dbContext.Database.MigrateAsync(cancellationToken);

        if (await userManager.Users.AnyAsync(cancellationToken))
        {
            return;
        }

        var tenant = new Tenant
        {
            Name = "Acme Corp",
            Slug = "acme-corp",
            Plan = "free",
            Status = EntityStatus.Active
        };

        var user = new User
        {
            Email = "owner@company.com",
            UserName = "owner@company.com",
            FullName = "John Smith",
            EmailConfirmed = true,
            Status = EntityStatus.Active
        };

        dbContext.Tenants.Add(tenant);
        var createResult = await userManager.CreateAsync(user, "SecurePass123!");

        if (!createResult.Succeeded)
        {
            var errors = string.Join(", ", createResult.Errors.Select(error => error.Description));
            _logger.LogError("Failed to seed development user: {Errors}", errors);
            return;
        }

        dbContext.TenantMembers.Add(new TenantMember
        {
            TenantId = tenant.Id,
            UserId = user.Id,
            Role = TenantRole.Owner,
            Status = EntityStatus.Active
        });

        await dbContext.SaveChangesAsync(cancellationToken);
        _logger.LogInformation("Seeded development login: owner@company.com / SecurePass123!");
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}
