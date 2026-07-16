using Microsoft.EntityFrameworkCore;
using SupportFlow.Customer.Domain.Entities;
using SupportFlow.Shared.Infrastructure.Persistence;
using SupportFlow.Shared.Kernel.Interfaces;
using SupportFlow.Shared.Kernel.Tenancy;
using CustomerEntity = SupportFlow.Customer.Domain.Entities.Customer;

namespace SupportFlow.Customer.Infrastructure.Persistence;

public class CustomerDbContext : DbContext
{
    private readonly ITenantContext _tenantContext;

    public CustomerDbContext(
        DbContextOptions<CustomerDbContext> options,
        ITenantContext tenantContext)
        : base(options)
    {
        _tenantContext = tenantContext;
    }

    /// <summary>Design-time and tests without a request scope.</summary>
    public CustomerDbContext(DbContextOptions<CustomerDbContext> options)
        : this(options, new TenantContext())
    {
    }

    public DbSet<CustomerEntity> Customers => Set<CustomerEntity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<CustomerEntity>(entity =>
        {
            entity.ToTable("Customers");
            entity.HasKey(x => x.Id);

            entity.Property(x => x.Email).HasMaxLength(256);
            entity.Property(x => x.Name).HasMaxLength(200);
            entity.Property(x => x.ExternalId).HasMaxLength(128);
            entity.Property(x => x.MetadataJson).HasColumnType("nvarchar(max)");
            entity.Property(x => x.TagsJson).HasColumnType("nvarchar(max)");
            entity.Property(x => x.Status).HasConversion<int>();

            entity.HasIndex(x => new { x.TenantId, x.Email });
            entity.HasIndex(x => new { x.TenantId, x.ExternalId });
        });

        modelBuilder.ApplyTenantAndSoftDeleteFilters(_tenantContext);
    }
}
