using Microsoft.EntityFrameworkCore;
using SupportFlow.Shared.Kernel.Interfaces;
using SupportFlow.Shared.Kernel.Tenancy;
using SupportFlow.Workspace.Domain.Entities;

namespace SupportFlow.Workspace.Infrastructure.Persistence;

public class WorkspaceDbContext : DbContext
{
    private readonly ITenantContext _tenantContext;

    public WorkspaceDbContext(
        DbContextOptions<WorkspaceDbContext> options,
        ITenantContext tenantContext)
        : base(options)
    {
        _tenantContext = tenantContext;
    }

    /// <summary>Design-time and tests without a request scope.</summary>
    public WorkspaceDbContext(DbContextOptions<WorkspaceDbContext> options)
        : this(options, new TenantContext())
    {
    }

    public DbSet<WorkspaceProfile> Workspaces => Set<WorkspaceProfile>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<WorkspaceProfile>(entity =>
        {
            entity.ToTable("Workspaces");
            entity.HasKey(x => x.Id);

            entity.Property(x => x.Name).HasMaxLength(200).IsRequired();
            entity.Property(x => x.Slug).HasMaxLength(100).IsRequired();
            entity.Property(x => x.Timezone).HasMaxLength(100).IsRequired();
            entity.Property(x => x.Plan).HasMaxLength(50).IsRequired();
            entity.Property(x => x.SettingsJson).HasColumnType("nvarchar(max)");
            entity.Property(x => x.Status).HasConversion<int>();

            entity.HasIndex(x => x.Slug).IsUnique();

            // Workspace row Id == TenantId (not ITenantEntity); isolate by Id.
            entity.HasQueryFilter(e => !e.IsDeleted && e.Id == _tenantContext.TenantId);
        });
    }
}
