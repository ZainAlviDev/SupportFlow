using Ganss.Xss;
using Microsoft.EntityFrameworkCore;
using SupportFlow.Knowledge.Application.Common.Exceptions;
using SupportFlow.Knowledge.Application.Common.Interfaces;
using SupportFlow.Knowledge.Domain.Entities;
using SupportFlow.Knowledge.Domain.Enums;
using SupportFlow.Knowledge.Infrastructure.Persistence;
using SupportFlow.Shared.Contracts.Knowledge;

namespace SupportFlow.Knowledge.Infrastructure.Knowledge;

public sealed class KnowledgeArticleService : IKnowledgeArticleService
{
    private readonly KnowledgeDbContext _dbContext;
    private readonly IArticleEmbeddingDispatcher _embeddingDispatcher;
    private readonly HtmlSanitizer _sanitizer;

    public KnowledgeArticleService(
        KnowledgeDbContext dbContext,
        IArticleEmbeddingDispatcher embeddingDispatcher,
        HtmlSanitizer sanitizer)
    {
        _dbContext = dbContext;
        _embeddingDispatcher = embeddingDispatcher;
        _sanitizer = sanitizer;
    }

    public async Task<IReadOnlyList<KnowledgeArticleDto>> ListAsync(
        Guid tenantId,
        string? search,
        string? status,
        string? category,
        int page,
        int pageSize,
        CancellationToken cancellationToken)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = _dbContext.KnowledgeArticles
            .AsNoTracking()
            .Where(x => x.TenantId == tenantId);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(x => x.Title.Contains(term) || x.Content.Contains(term));
        }

        if (!string.IsNullOrWhiteSpace(category))
        {
            query = query.Where(x => x.Category == category.Trim());
        }

        if (!string.IsNullOrWhiteSpace(status))
        {
            var articleStatus = ParseStatus(status);
            query = query.Where(x => x.ArticleStatus == articleStatus);
        }

        var rows = await query
            .OrderByDescending(x => x.UpdatedAt ?? x.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new
            {
                x.Id,
                x.TenantId,
                x.Title,
                x.Content,
                x.Category,
                x.ArticleStatus,
                ChunkCount = x.Chunks.Count,
                x.CreatedAt,
                x.UpdatedAt
            })
            .ToListAsync(cancellationToken);

        return rows.Select(x => new KnowledgeArticleDto(
            x.Id,
            x.TenantId,
            x.Title,
            x.Content,
            x.Category,
            x.ArticleStatus.ToString(),
            x.ChunkCount,
            x.CreatedAt,
            x.UpdatedAt)).ToList();
    }

    public async Task<KnowledgeArticleDto?> GetByIdAsync(
        Guid tenantId,
        Guid articleId,
        CancellationToken cancellationToken)
    {
        var article = await _dbContext.KnowledgeArticles
            .AsNoTracking()
            .Where(x => x.TenantId == tenantId && x.Id == articleId)
            .Select(x => new { Article = x, ChunkCount = x.Chunks.Count })
            .SingleOrDefaultAsync(cancellationToken);

        return article is null ? null : Map(article.Article, article.ChunkCount);
    }

    public async Task<KnowledgeArticleDto> CreateAsync(
        Guid tenantId,
        Guid? createdBy,
        CreateKnowledgeArticleRequest request,
        CancellationToken cancellationToken)
    {
        var article = new KnowledgeArticle(
            tenantId,
            request.Title,
            _sanitizer.Sanitize(request.Content),
            request.Category)
        {
            CreatedBy = createdBy
        };

        if (request.Publish)
        {
            article.Publish();
        }

        _dbContext.KnowledgeArticles.Add(article);
        await _dbContext.SaveChangesAsync(cancellationToken);
        _embeddingDispatcher.Enqueue(tenantId, article.Id);
        return Map(article, 0);
    }

    public async Task<KnowledgeArticleDto> UpdateAsync(
        Guid tenantId,
        Guid articleId,
        Guid? updatedBy,
        UpdateKnowledgeArticleRequest request,
        CancellationToken cancellationToken)
    {
        var article = await _dbContext.KnowledgeArticles
            .Include(x => x.Chunks)
            .SingleOrDefaultAsync(x => x.TenantId == tenantId && x.Id == articleId, cancellationToken)
            ?? throw new NotFoundException("Knowledge article was not found.");

        article.Update(request.Title, _sanitizer.Sanitize(request.Content), request.Category);
        article.UpdatedBy = updatedBy;

        if (!string.IsNullOrWhiteSpace(request.Status))
        {
            if (ParseStatus(request.Status) == ArticleStatus.Published)
            {
                article.Publish();
            }
            else
            {
                article.MoveToDraft();
            }
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
        _embeddingDispatcher.Enqueue(tenantId, article.Id);
        return Map(article, article.Chunks.Count);
    }

    public async Task DeleteAsync(
        Guid tenantId,
        Guid articleId,
        Guid? deletedBy,
        CancellationToken cancellationToken)
    {
        var article = await _dbContext.KnowledgeArticles
            .SingleOrDefaultAsync(x => x.TenantId == tenantId && x.Id == articleId, cancellationToken)
            ?? throw new NotFoundException("Knowledge article was not found.");

        article.IsDeleted = true;
        article.DeletedAt = DateTime.UtcNow;
        article.DeletedBy = deletedBy;
        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    private static ArticleStatus ParseStatus(string status) =>
        Enum.TryParse<ArticleStatus>(status, true, out var parsed)
            ? parsed
            : throw new ArgumentException("Status must be Draft or Published.", nameof(status));

    private static KnowledgeArticleDto Map(KnowledgeArticle article, int chunkCount) =>
        new(
            article.Id,
            article.TenantId,
            article.Title,
            article.Content,
            article.Category,
            article.ArticleStatus.ToString(),
            chunkCount,
            article.CreatedAt,
            article.UpdatedAt);
}
