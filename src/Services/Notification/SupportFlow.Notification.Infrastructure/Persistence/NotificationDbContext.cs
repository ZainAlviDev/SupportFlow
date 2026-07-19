using Microsoft.EntityFrameworkCore;
using SupportFlow.Notification.Domain.Entities;
using SupportFlow.Shared.Infrastructure.Persistence;
using SupportFlow.Shared.Kernel.Interfaces;
using SupportFlow.Shared.Kernel.Tenancy;

namespace SupportFlow.Notification.Infrastructure.Persistence;

public sealed class NotificationDbContext : DbContext
{
    private readonly ITenantContext _tenantContext;

    public NotificationDbContext(
        DbContextOptions<NotificationDbContext> options,
        ITenantContext tenantContext)
        : base(options)
    {
        _tenantContext = tenantContext;
    }

    public NotificationDbContext(DbContextOptions<NotificationDbContext> options)
        : this(options, new TenantContext())
    {
    }

    public DbSet<AppNotification> Notifications => Set<AppNotification>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<AppNotification>(entity =>
        {
            entity.ToTable("Notifications");
            entity.HasKey(x => x.Id);

            entity.Property(x => x.Type).HasConversion<int>();
            entity.Property(x => x.Title).HasMaxLength(200).IsRequired();
            entity.Property(x => x.Body).HasMaxLength(2000).IsRequired();
            entity.Property(x => x.ResourceType).HasMaxLength(100);
            entity.Property(x => x.IdempotencyKey).HasMaxLength(200);

            entity.HasIndex(x => new { x.TenantId, x.UserId, x.IsRead, x.CreatedAt });
            entity.HasIndex(x => new { x.TenantId, x.IdempotencyKey })
                .IsUnique()
                .HasFilter("[IdempotencyKey] IS NOT NULL");
        });

        modelBuilder.ApplyTenantAndSoftDeleteFilters(_tenantContext);
    }
}
