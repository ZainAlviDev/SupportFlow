using Microsoft.EntityFrameworkCore;
using SupportFlow.Conversation.Domain.Entities;
using SupportFlow.Shared.Infrastructure.Persistence;
using SupportFlow.Shared.Kernel.Interfaces;
using SupportFlow.Shared.Kernel.Tenancy;
using ConversationEntity = SupportFlow.Conversation.Domain.Entities.Conversation;

namespace SupportFlow.Conversation.Infrastructure.Persistence;

public class ConversationDbContext : DbContext
{
    private readonly ITenantContext _tenantContext;

    public ConversationDbContext(
        DbContextOptions<ConversationDbContext> options,
        ITenantContext tenantContext)
        : base(options)
    {
        _tenantContext = tenantContext;
    }

    /// <summary>Design-time and tests without a request scope.</summary>
    public ConversationDbContext(DbContextOptions<ConversationDbContext> options)
        : this(options, new TenantContext())
    {
    }

    public DbSet<ConversationEntity> Conversations => Set<ConversationEntity>();
    public DbSet<Message> Messages => Set<Message>();
    public DbSet<MessageAttachment> MessageAttachments => Set<MessageAttachment>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<ConversationEntity>(entity =>
        {
            entity.ToTable("Conversations");
            entity.HasKey(x => x.Id);

            entity.Property(x => x.ConversationStatus).HasConversion<int>();
            entity.Property(x => x.Channel).HasConversion<int>();
            entity.Property(x => x.TagsJson).HasColumnType("nvarchar(max)");

            entity.HasIndex(x => new { x.TenantId, x.ConversationStatus, x.LastMessageAt });
            entity.HasIndex(x => new { x.TenantId, x.AssigneeId, x.ConversationStatus });
        });

        modelBuilder.Entity<Message>(entity =>
        {
            entity.ToTable("Messages");
            entity.HasKey(x => x.Id);

            entity.Property(x => x.SenderType).HasConversion<int>();
            entity.Property(x => x.Body).HasMaxLength(8000).IsRequired();

            entity.HasOne(x => x.Conversation)
                .WithMany(x => x.Messages)
                .HasForeignKey(x => x.ConversationId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(x => new { x.ConversationId, x.CreatedAt });
        });

        modelBuilder.Entity<MessageAttachment>(entity =>
        {
            entity.ToTable("MessageAttachments");
            entity.HasKey(x => x.Id);

            entity.Property(x => x.FileName).HasMaxLength(260).IsRequired();
            entity.Property(x => x.BlobUrl).HasMaxLength(2048).IsRequired();
            entity.Property(x => x.MimeType).HasMaxLength(128).IsRequired();

            entity.HasOne(x => x.Message)
                .WithMany(x => x.Attachments)
                .HasForeignKey(x => x.MessageId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.ApplyTenantAndSoftDeleteFilters(_tenantContext);
    }
}
