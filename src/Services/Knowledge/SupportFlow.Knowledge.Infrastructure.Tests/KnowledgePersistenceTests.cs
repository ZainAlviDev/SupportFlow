using Ganss.Xss;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using SupportFlow.Knowledge.Application.Common.Interfaces;
using SupportFlow.Knowledge.Domain.Entities;
using SupportFlow.Knowledge.Domain.Enums;
using SupportFlow.Knowledge.Infrastructure.AI;
using SupportFlow.Knowledge.Infrastructure.Knowledge;
using SupportFlow.Knowledge.Infrastructure.Jobs;
using SupportFlow.Knowledge.Infrastructure.Persistence;
using SupportFlow.Shared.Kernel.Tenancy;
using SupportFlow.Shared.Contracts.Knowledge;
using Xunit;

namespace SupportFlow.Knowledge.Infrastructure.Tests;

public sealed class KnowledgePersistenceTests : IAsyncLifetime
{
    private const string ConnectionString =
        "Server=.\\SQLEXPRESS;Database=SupportFlowKnowledgeDb;Trusted_Connection=True;MultipleActiveResultSets=true;TrustServerCertificate=True;Encrypt=True";

    private readonly string _testPrefix = $"integration-{Guid.NewGuid():N}";

    public async Task InitializeAsync()
    {
        await using var context = CreateContext(Guid.NewGuid());
        await context.Database.MigrateAsync();
    }

    public async Task DisposeAsync()
    {
        await using var context = CreateContext(Guid.NewGuid());
        var articles = await context.KnowledgeArticles
            .IgnoreQueryFilters()
            .Where(x => x.Title.StartsWith(_testPrefix))
            .ToListAsync();

        context.KnowledgeArticles.RemoveRange(articles);
        await context.SaveChangesAsync();
    }

    [Fact]
    public async Task QueryFilters_IsolateTenantsAndSoftDeletedArticles()
    {
        var tenantA = Guid.NewGuid();
        var tenantB = Guid.NewGuid();
        var visible = NewArticle(tenantA, "visible");
        var deleted = NewArticle(tenantA, "deleted");
        deleted.IsDeleted = true;
        var otherTenant = NewArticle(tenantB, "other");

        await using (var writeContext = CreateContext(tenantA))
        {
            writeContext.KnowledgeArticles.AddRange(visible, deleted, otherTenant);
            await writeContext.SaveChangesAsync();
        }

        await using var readContext = CreateContext(tenantA);
        var results = await readContext.KnowledgeArticles
            .Where(x => x.Title.StartsWith(_testPrefix))
            .ToListAsync();

        var article = Assert.Single(results);
        Assert.Equal(visible.Id, article.Id);
    }

    [Fact]
    public void Article_ControlsPublicationAndValidatesEmbeddingDimensions()
    {
        var article = NewArticle(Guid.NewGuid(), "domain");

        Assert.Equal(ArticleStatus.Draft, article.ArticleStatus);
        article.Publish();
        Assert.Equal(ArticleStatus.Published, article.ArticleStatus);
        article.MoveToDraft();
        Assert.Equal(ArticleStatus.Draft, article.ArticleStatus);

        Assert.Throws<ArgumentException>(() =>
            article.AddChunk("invalid", 0, new float[ArticleChunk.EmbeddingDimensions - 1]));
    }

    [Fact]
    public async Task DuplicateChunkIndex_IsRejected()
    {
        var tenantId = Guid.NewGuid();
        var article = NewArticle(tenantId, "duplicates");
        article.AddChunk("first", 0, UnitVector());
        article.AddChunk("duplicate", 0, UnitVector());

        await using var context = CreateContext(tenantId);
        context.KnowledgeArticles.Add(article);

        await Assert.ThrowsAsync<DbUpdateException>(() => context.SaveChangesAsync());
    }

    [Fact]
    public async Task DeletingArticle_CascadesToChunks()
    {
        var tenantId = Guid.NewGuid();
        var article = NewArticle(tenantId, "cascade");
        var chunk = article.AddChunk("chunk", 0, UnitVector());

        await using (var writeContext = CreateContext(tenantId))
        {
            writeContext.KnowledgeArticles.Add(article);
            await writeContext.SaveChangesAsync();
        }

        await using (var deleteContext = CreateContext(tenantId))
        {
            var persisted = await deleteContext.KnowledgeArticles.SingleAsync(x => x.Id == article.Id);
            deleteContext.KnowledgeArticles.Remove(persisted);
            await deleteContext.SaveChangesAsync();
        }

        await using var verifyContext = CreateContext(tenantId);
        Assert.False(await verifyContext.ArticleChunks.IgnoreQueryFilters().AnyAsync(x => x.Id == chunk.Id));
    }

    [Fact]
    public async Task Embedding_RoundTripsAndSupportsCosineDistance()
    {
        var tenantId = Guid.NewGuid();
        var embedding = UnitVector();
        var article = NewArticle(tenantId, "vector");
        var chunk = article.AddChunk("semantic content", 0, embedding);

        await using (var writeContext = CreateContext(tenantId))
        {
            writeContext.KnowledgeArticles.Add(article);
            await writeContext.SaveChangesAsync();
        }

        await using var readContext = CreateContext(tenantId);
        var result = await readContext.ArticleChunks
            .Where(x => x.Id == chunk.Id)
            .Select(x => new
            {
                x.Embedding,
                Distance = EF.Functions.VectorDistance("cosine", x.Embedding, embedding)
            })
            .SingleAsync();

        Assert.Equal(ArticleChunk.EmbeddingDimensions, result.Embedding.Length);
        Assert.Equal(0d, result.Distance, 6);
    }

    [Fact]
    public async Task DevelopmentEmbedding_IsDeterministicAndCorrectlySized()
    {
        var service = new AzureOpenAiEmbeddingService(
            new HttpClient(),
            Options.Create(new AzureOpenAiOptions { UseDevelopmentFallback = true }));

        var first = await service.CreateEmbeddingAsync("reset a forgotten password", CancellationToken.None);
        var second = await service.CreateEmbeddingAsync("reset a forgotten password", CancellationToken.None);

        Assert.Equal(ArticleChunk.EmbeddingDimensions, first.Length);
        Assert.Equal(first, second);
        Assert.Contains(first, value => value != 0);
    }

    [Fact]
    public async Task ArticleService_CreatesSanitizedArticleAndListsIt()
    {
        var tenantId = Guid.NewGuid();
        await using var context = CreateContext(tenantId);
        var dispatcher = new RecordingEmbeddingDispatcher();
        var service = new KnowledgeArticleService(context, dispatcher, new HtmlSanitizer());

        var created = await service.CreateAsync(
            tenantId,
            Guid.NewGuid(),
            new CreateKnowledgeArticleRequest(
                $"{_testPrefix}-crud",
                "<p>Safe content</p><script>alert('xss')</script>",
                "Guides",
                true),
            CancellationToken.None);

        var listed = await service.ListAsync(
            tenantId,
            _testPrefix,
            "Published",
            "Guides",
            1,
            20,
            CancellationToken.None);

        Assert.DoesNotContain("<script", created.Content, StringComparison.OrdinalIgnoreCase);
        Assert.Equal(created.Id, Assert.Single(listed).Id);
        Assert.Equal(created.Id, dispatcher.ArticleId);
    }

    [Fact]
    public async Task EmbeddingJob_CreatesSearchableChunks()
    {
        var tenantId = Guid.NewGuid();
        var article = NewArticle(tenantId, "searchable");
        article.Update(
            article.Title,
            "<p>Password recovery uses a one-time verification code sent to the account owner.</p>",
            article.Category);
        article.Publish();

        await using (var writeContext = CreateContext(tenantId))
        {
            writeContext.KnowledgeArticles.Add(article);
            await writeContext.SaveChangesAsync();
        }

        var embeddingService = new AzureOpenAiEmbeddingService(
            new HttpClient(),
            Options.Create(new AzureOpenAiOptions { UseDevelopmentFallback = true }));

        await using (var jobContext = CreateContext(tenantId))
        {
            var job = new ArticleEmbeddingJob(
                jobContext,
                embeddingService,
                NullLogger<ArticleEmbeddingJob>.Instance);
            await job.ProcessAsync(tenantId, article.Id, CancellationToken.None);
        }

        await using var searchContext = CreateContext(tenantId);
        var search = new KnowledgeSearchService(searchContext, embeddingService);
        var results = await search.SearchAsync(
            tenantId,
            "How does password recovery verification work?",
            5,
            CancellationToken.None);

        Assert.Equal(article.Id, Assert.Single(results).ArticleId);
    }

    private KnowledgeArticle NewArticle(Guid tenantId, string suffix) =>
        new(tenantId, $"{_testPrefix}-{suffix}", "<p>Test content</p>", "Testing");

    private static float[] UnitVector()
    {
        var vector = new float[ArticleChunk.EmbeddingDimensions];
        vector[0] = 1f;
        return vector;
    }

    private static KnowledgeDbContext CreateContext(Guid tenantId)
    {
        var tenantContext = new TenantContext();
        tenantContext.SetTenant(tenantId);

        var options = new DbContextOptionsBuilder<KnowledgeDbContext>()
            .UseSqlServer(ConnectionString, sqlServer => sqlServer.UseVectorSearch())
            .Options;

        return new KnowledgeDbContext(options, tenantContext);
    }

    private sealed class RecordingEmbeddingDispatcher : IArticleEmbeddingDispatcher
    {
        public Guid? ArticleId { get; private set; }

        public string Enqueue(Guid tenantId, Guid articleId)
        {
            ArticleId = articleId;
            return Guid.NewGuid().ToString("N");
        }
    }
}
