using Microsoft.EntityFrameworkCore;
using SupportFlow.Shared.Contracts.Workspaces;
using SupportFlow.Shared.Kernel.Tenancy;
using SupportFlow.Workspace.Domain.Entities;
using SupportFlow.Workspace.Infrastructure.Persistence;
using SupportFlow.Workspace.Infrastructure.Workspaces;
using Xunit;

namespace SupportFlow.Workspace.Infrastructure.Tests;

[Collection("WorkspaceSql")]
public sealed class WorkspaceTenantIsolationTests : IAsyncLifetime
{
    private static readonly string ConnectionString =
        "Server=.\\SQLEXPRESS;Database=SupportFlowWorkspaceTestDb;Trusted_Connection=True;MultipleActiveResultSets=true;TrustServerCertificate=True;Encrypt=True";

    private readonly string _prefix = $"ws-{Guid.NewGuid():N}";

    public async Task InitializeAsync()
    {
        await using var context = CreateContext(Guid.NewGuid());
        await context.Database.MigrateAsync();
    }

    public async Task DisposeAsync()
    {
        await using var context = CreateContext(Guid.NewGuid());
        var rows = await context.Workspaces
            .IgnoreQueryFilters()
            .Where(x => x.Name.StartsWith(_prefix))
            .ToListAsync();
        context.Workspaces.RemoveRange(rows);
        await context.SaveChangesAsync();
    }

    [Fact]
    public async Task QueryFilter_HidesOtherTenantWorkspace()
    {
        var tenantA = Guid.NewGuid();
        var tenantB = Guid.NewGuid();

        await using (var write = CreateContext(tenantA))
        {
            write.Workspaces.Add(new WorkspaceProfile(tenantA, $"{_prefix}-A", $"{_prefix}-a"));
            write.Workspaces.Add(new WorkspaceProfile(tenantB, $"{_prefix}-B", $"{_prefix}-b"));
            await write.SaveChangesAsync();
        }

        await using var readA = CreateContext(tenantA);
        var visible = await readA.Workspaces.ToListAsync();
        Assert.Contains(visible, x => x.Id == tenantA);
        Assert.DoesNotContain(visible, x => x.Id == tenantB);
    }

    [Fact]
    public async Task UpdateCurrent_DoesNotLeakSettingsAcrossTenants()
    {
        var tenantA = Guid.NewGuid();
        var tenantB = Guid.NewGuid();

        await using (var seed = CreateContext(tenantA))
        {
            seed.Workspaces.Add(new WorkspaceProfile(tenantA, $"{_prefix}-A", $"{_prefix}-a"));
            seed.Workspaces.Add(new WorkspaceProfile(tenantB, $"{_prefix}-B", $"{_prefix}-b"));
            await seed.SaveChangesAsync();
        }

        await using (var writeA = CreateContext(tenantA))
        {
            var service = new WorkspaceService(writeA);
            await service.UpdateCurrentAsync(
                tenantA,
                name: null,
                timezone: null,
                settingsJson: null,
                widget: new WidgetSettingsDto("#abcdef", "bottom-left", "Hello A"),
                businessHours: null,
                CancellationToken.None);
        }

        await using var readB = CreateContext(tenantB);
        var serviceB = new WorkspaceService(readB);
        var workspaceB = await serviceB.GetCurrentAsync(tenantB, CancellationToken.None);

        Assert.DoesNotContain("#abcdef", workspaceB.SettingsJson ?? "", StringComparison.Ordinal);
        Assert.DoesNotContain("Hello A", workspaceB.Widget?.WelcomeMessage ?? "", StringComparison.Ordinal);
    }

    private static WorkspaceDbContext CreateContext(Guid tenantId)
    {
        var tenantContext = new TenantContext();
        tenantContext.SetTenant(tenantId);
        var options = new DbContextOptionsBuilder<WorkspaceDbContext>()
            .UseSqlServer(ConnectionString)
            .Options;
        return new WorkspaceDbContext(options, tenantContext);
    }
}
