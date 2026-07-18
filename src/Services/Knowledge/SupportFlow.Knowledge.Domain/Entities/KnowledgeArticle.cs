using SupportFlow.Knowledge.Domain.Enums;
using SupportFlow.Shared.Kernel.Entities;
using SupportFlow.Shared.Kernel.Interfaces;

namespace SupportFlow.Knowledge.Domain.Entities;

public sealed class KnowledgeArticle : AuditableEntity, ITenantEntity
{
    private KnowledgeArticle()
    {
    }

    public KnowledgeArticle(Guid tenantId, string title, string content, string? category = null)
    {
        if (tenantId == Guid.Empty)
        {
            throw new ArgumentException("Tenant ID is required.", nameof(tenantId));
        }

        TenantId = tenantId;
        SetTitle(title);
        SetContent(content);
        Category = NormalizeOptional(category);
        ArticleStatus = ArticleStatus.Draft;
    }

    public Guid TenantId { get; set; }
    public string Title { get; private set; } = string.Empty;
    public string Content { get; private set; } = string.Empty;
    public string? Category { get; private set; }
    public ArticleStatus ArticleStatus { get; private set; }
    public ICollection<ArticleChunk> Chunks { get; private set; } = new List<ArticleChunk>();

    public void Update(string title, string content, string? category)
    {
        SetTitle(title);
        SetContent(content);
        Category = NormalizeOptional(category);
        UpdatedAt = DateTime.UtcNow;
    }

    public void Publish()
    {
        if (ArticleStatus == ArticleStatus.Published)
        {
            return;
        }

        ArticleStatus = ArticleStatus.Published;
        UpdatedAt = DateTime.UtcNow;
    }

    public void MoveToDraft()
    {
        if (ArticleStatus == ArticleStatus.Draft)
        {
            return;
        }

        ArticleStatus = ArticleStatus.Draft;
        UpdatedAt = DateTime.UtcNow;
    }

    public ArticleChunk AddChunk(string content, int chunkIndex, float[] embedding)
    {
        var chunk = new ArticleChunk(TenantId, Id, content, chunkIndex, embedding);
        Chunks.Add(chunk);
        return chunk;
    }

    private void SetTitle(string title)
    {
        if (string.IsNullOrWhiteSpace(title))
        {
            throw new ArgumentException("Article title is required.", nameof(title));
        }

        var normalized = title.Trim();
        if (normalized.Length > 300)
        {
            throw new ArgumentException("Article title must be at most 300 characters.", nameof(title));
        }

        Title = normalized;
    }

    private void SetContent(string content)
    {
        if (string.IsNullOrWhiteSpace(content))
        {
            throw new ArgumentException("Article content is required.", nameof(content));
        }

        Content = content.Trim();
    }

    private static string? NormalizeOptional(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        var normalized = value.Trim();
        if (normalized.Length > 150)
        {
            throw new ArgumentException("Article category must be at most 150 characters.", nameof(value));
        }

        return normalized;
    }
}
