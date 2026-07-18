using SupportFlow.Shared.Kernel.Entities;
using SupportFlow.Shared.Kernel.Interfaces;

namespace SupportFlow.Knowledge.Domain.Entities;

public sealed class ArticleChunk : BaseEntity, ITenantEntity
{
    public const int EmbeddingDimensions = 1536;

    private ArticleChunk()
    {
    }

    internal ArticleChunk(
        Guid tenantId,
        Guid articleId,
        string content,
        int chunkIndex,
        float[] embedding)
    {
        if (tenantId == Guid.Empty)
        {
            throw new ArgumentException("Tenant ID is required.", nameof(tenantId));
        }

        if (articleId == Guid.Empty)
        {
            throw new ArgumentException("Article ID is required.", nameof(articleId));
        }

        if (string.IsNullOrWhiteSpace(content))
        {
            throw new ArgumentException("Chunk content is required.", nameof(content));
        }

        if (chunkIndex < 0)
        {
            throw new ArgumentOutOfRangeException(nameof(chunkIndex), "Chunk index cannot be negative.");
        }

        ArgumentNullException.ThrowIfNull(embedding);
        if (embedding.Length != EmbeddingDimensions)
        {
            throw new ArgumentException(
                $"Embedding must contain exactly {EmbeddingDimensions} dimensions.",
                nameof(embedding));
        }

        TenantId = tenantId;
        ArticleId = articleId;
        Content = content.Trim();
        ChunkIndex = chunkIndex;
        Embedding = embedding.ToArray();
    }

    public Guid TenantId { get; set; }
    public Guid ArticleId { get; private set; }
    public string Content { get; private set; } = string.Empty;
    public int ChunkIndex { get; private set; }
    public float[] Embedding { get; private set; } = [];
    public KnowledgeArticle? Article { get; private set; }
}
