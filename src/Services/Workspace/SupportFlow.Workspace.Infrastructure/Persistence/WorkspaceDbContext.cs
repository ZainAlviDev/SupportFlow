using Microsoft.EntityFrameworkCore;
using SupportFlow.Workspace.Domain.Entities;

namespace SupportFlow.Workspace.Infrastructure.Persistence;

public class WorkspaceDbContext : DbContext
{
    public WorkspaceDbContext(DbContextOptions<WorkspaceDbContext> options)
        : base(options)
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
        });
    }
}
