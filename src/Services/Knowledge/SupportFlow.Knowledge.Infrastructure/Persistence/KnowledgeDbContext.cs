using Microsoft.EntityFrameworkCore;
using SupportFlow.Knowledge.Domain.Entities;
using SupportFlow.Shared.Kernel.Interfaces;
using SupportFlow.Shared.Kernel.Tenancy;

namespace SupportFlow.Knowledge.Infrastructure.Persistence;

public sealed class KnowledgeDbContext : DbContext
{
    private readonly ITenantContext _tenantContext;

    public KnowledgeDbContext(
        DbContextOptions<KnowledgeDbContext> options,
        ITenantContext tenantContext)
        : base(options)
    {
        _tenantContext = tenantContext;
    }

    public KnowledgeDbContext(DbContextOptions<KnowledgeDbContext> options)
        : this(options, new TenantContext())
    {
    }

    public DbSet<KnowledgeArticle> KnowledgeArticles => Set<KnowledgeArticle>();
    public DbSet<ArticleChunk> ArticleChunks => Set<ArticleChunk>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<KnowledgeArticle>(entity =>
        {
            entity.ToTable("KnowledgeArticles");
            entity.HasKey(x => x.Id);

            entity.Property(x => x.Title).HasMaxLength(300).IsRequired();
            entity.Property(x => x.Content).HasColumnType("nvarchar(max)").IsRequired();
            entity.Property(x => x.Category).HasMaxLength(150);
            entity.Property(x => x.ArticleStatus).HasConversion<int>();
            entity.Property(x => x.Status).HasConversion<int>();

            entity.HasIndex(x => new { x.TenantId, x.ArticleStatus });
            entity.HasIndex(x => new { x.TenantId, x.Category });
            entity.HasQueryFilter(x => x.TenantId == _tenantContext.TenantId && !x.IsDeleted);
        });

        modelBuilder.Entity<ArticleChunk>(entity =>
        {
            entity.ToTable("ArticleChunks");
            entity.HasKey(x => x.Id);

            entity.Property(x => x.Content).HasColumnType("nvarchar(max)").IsRequired();
            entity.Property(x => x.Embedding)
                .HasColumnType($"vector({ArticleChunk.EmbeddingDimensions})")
                .IsRequired();

            entity.HasOne(x => x.Article)
                .WithMany(x => x.Chunks)
                .HasForeignKey(x => x.ArticleId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(x => new { x.TenantId, x.ArticleId, x.ChunkIndex }).IsUnique();
            entity.HasQueryFilter(x => x.TenantId == _tenantContext.TenantId);
        });
    }
}
