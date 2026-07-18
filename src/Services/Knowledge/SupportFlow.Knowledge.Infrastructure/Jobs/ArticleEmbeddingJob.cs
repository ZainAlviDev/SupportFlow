using System.Net;
using System.Text.RegularExpressions;
using Hangfire;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SupportFlow.Knowledge.Application.Common.Interfaces;
using SupportFlow.Knowledge.Infrastructure.Persistence;

namespace SupportFlow.Knowledge.Infrastructure.Jobs;

public sealed partial class ArticleEmbeddingJob
{
    private const int ChunkWordCount = 375;
    private const int ChunkOverlap = 40;

    private readonly KnowledgeDbContext _dbContext;
    private readonly IEmbeddingService _embeddingService;
    private readonly ILogger<ArticleEmbeddingJob> _logger;

    public ArticleEmbeddingJob(
        KnowledgeDbContext dbContext,
        IEmbeddingService embeddingService,
        ILogger<ArticleEmbeddingJob> logger)
    {
        _dbContext = dbContext;
        _embeddingService = embeddingService;
        _logger = logger;
    }

    [AutomaticRetry(Attempts = 3, DelaysInSeconds = [10, 30, 120])]
    public async Task ProcessAsync(
        Guid tenantId,
        Guid articleId,
        CancellationToken cancellationToken)
    {
        var article = await _dbContext.KnowledgeArticles
            .IgnoreQueryFilters()
            .Include(x => x.Chunks)
            .SingleOrDefaultAsync(
                x => x.TenantId == tenantId && x.Id == articleId && !x.IsDeleted,
                cancellationToken);

        if (article is null)
        {
            _logger.LogWarning("Skipping embedding for missing article {ArticleId}.", articleId);
            return;
        }

        _dbContext.ArticleChunks.RemoveRange(article.Chunks);
        await _dbContext.SaveChangesAsync(cancellationToken);
        _dbContext.ChangeTracker.Clear();
        article = await _dbContext.KnowledgeArticles
            .IgnoreQueryFilters()
            .SingleAsync(
                x => x.TenantId == tenantId && x.Id == articleId && !x.IsDeleted,
                cancellationToken);

        var chunks = SplitIntoChunks(ToPlainText(article.Content));

        for (var index = 0; index < chunks.Count; index++)
        {
            var embedding = await _embeddingService.CreateEmbeddingAsync(chunks[index], cancellationToken);
            var chunk = article.AddChunk(chunks[index], index, embedding);
            _dbContext.ArticleChunks.Add(chunk);
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
        _logger.LogInformation(
            "Generated {ChunkCount} embedding chunks for article {ArticleId}.",
            chunks.Count,
            articleId);
    }

    private static string ToPlainText(string html)
    {
        var withoutTags = HtmlTagRegex().Replace(html, " ");
        return WhitespaceRegex().Replace(WebUtility.HtmlDecode(withoutTags), " ").Trim();
    }

    private static IReadOnlyList<string> SplitIntoChunks(string content)
    {
        var words = content.Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        if (words.Length == 0)
        {
            return [];
        }

        var chunks = new List<string>();
        var step = ChunkWordCount - ChunkOverlap;
        for (var start = 0; start < words.Length; start += step)
        {
            var count = Math.Min(ChunkWordCount, words.Length - start);
            chunks.Add(string.Join(' ', words, start, count));
            if (start + count >= words.Length)
            {
                break;
            }
        }

        return chunks;
    }

    [GeneratedRegex("<[^>]+>", RegexOptions.Compiled)]
    private static partial Regex HtmlTagRegex();

    [GeneratedRegex("\\s+", RegexOptions.Compiled)]
    private static partial Regex WhitespaceRegex();
}
