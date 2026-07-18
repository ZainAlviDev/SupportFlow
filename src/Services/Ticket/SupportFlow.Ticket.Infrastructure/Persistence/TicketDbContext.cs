using Microsoft.EntityFrameworkCore;
using SupportFlow.Shared.Infrastructure.Persistence;
using SupportFlow.Shared.Kernel.Interfaces;
using SupportFlow.Shared.Kernel.Tenancy;
using SupportFlow.Ticket.Domain.Entities;
using TicketEntity = SupportFlow.Ticket.Domain.Entities.Ticket;

namespace SupportFlow.Ticket.Infrastructure.Persistence;

public class TicketDbContext : DbContext
{
    private readonly ITenantContext _tenantContext;

    public TicketDbContext(
        DbContextOptions<TicketDbContext> options,
        ITenantContext tenantContext)
        : base(options)
    {
        _tenantContext = tenantContext;
    }

    public TicketDbContext(DbContextOptions<TicketDbContext> options)
        : this(options, new TenantContext())
    {
    }

    public DbSet<TicketEntity> Tickets => Set<TicketEntity>();
    public DbSet<TicketComment> TicketComments => Set<TicketComment>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<TicketEntity>(entity =>
        {
            entity.ToTable("Tickets");
            entity.HasKey(x => x.Id);

            entity.Property(x => x.TicketNumber).HasMaxLength(32).IsRequired();
            entity.Property(x => x.Subject).HasMaxLength(300).IsRequired();
            entity.Property(x => x.Description).HasMaxLength(8000);
            entity.Property(x => x.Priority).HasConversion<int>();
            entity.Property(x => x.TicketStatus).HasConversion<int>();
            entity.Property(x => x.Status).HasConversion<int>();

            entity.HasIndex(x => new { x.TenantId, x.TicketNumber }).IsUnique();
            entity.HasIndex(x => new { x.TenantId, x.TicketStatus, x.AssigneeId });
            entity.HasIndex(x => new { x.TenantId, x.CustomerId });
        });

        modelBuilder.Entity<TicketComment>(entity =>
        {
            entity.ToTable("TicketComments");
            entity.HasKey(x => x.Id);

            entity.Property(x => x.Body).HasMaxLength(8000).IsRequired();

            entity.HasOne(x => x.Ticket)
                .WithMany(x => x.Comments)
                .HasForeignKey(x => x.TicketId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(x => new { x.TicketId, x.CreatedAt });
        });

        modelBuilder.ApplyTenantAndSoftDeleteFilters(_tenantContext);
    }
}
