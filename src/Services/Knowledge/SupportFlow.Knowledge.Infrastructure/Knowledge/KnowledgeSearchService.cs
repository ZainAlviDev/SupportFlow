using Microsoft.EntityFrameworkCore;
using SupportFlow.Knowledge.Application.Common.Interfaces;
using SupportFlow.Knowledge.Domain.Enums;
using SupportFlow.Knowledge.Infrastructure.Persistence;
using SupportFlow.Shared.Contracts.Knowledge;

namespace SupportFlow.Knowledge.Infrastructure.Knowledge;

public sealed class KnowledgeSearchService : IKnowledgeSearchService
{
    private readonly KnowledgeDbContext _dbContext;
    private readonly IEmbeddingService _embeddingService;

    public KnowledgeSearchService(
        KnowledgeDbContext dbContext,
        IEmbeddingService embeddingService)
    {
        _dbContext = dbContext;
        _embeddingService = embeddingService;
    }

    public async Task<IReadOnlyList<KnowledgeSourceDto>> SearchAsync(
        Guid tenantId,
        string query,
        int limit,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(query))
        {
            return [];
        }

        var embedding = await _embeddingService.CreateEmbeddingAsync(query.Trim(), cancellationToken);
        return await _dbContext.ArticleChunks
            .AsNoTracking()
            .Where(x =>
                x.TenantId == tenantId
                && x.Article != null
                && x.Article.ArticleStatus == ArticleStatus.Published
                && !x.Article.IsDeleted)
            .Select(x => new
            {
                x.ArticleId,
                ArticleTitle = x.Article!.Title,
                x.Content,
                Distance = EF.Functions.VectorDistance("cosine", x.Embedding, embedding)
            })
            .OrderBy(x => x.Distance)
            .Take(Math.Clamp(limit, 1, 10))
            .Select(x => new KnowledgeSourceDto(
                x.ArticleId,
                x.ArticleTitle,
                x.Content.Length > 500 ? x.Content.Substring(0, 500) : x.Content,
                x.Distance))
            .ToListAsync(cancellationToken);
    }
}
