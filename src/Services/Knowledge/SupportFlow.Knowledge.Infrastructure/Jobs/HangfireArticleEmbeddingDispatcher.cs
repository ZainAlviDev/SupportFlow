using Hangfire;
using SupportFlow.Knowledge.Application.Common.Interfaces;

namespace SupportFlow.Knowledge.Infrastructure.Jobs;

public sealed class HangfireArticleEmbeddingDispatcher : IArticleEmbeddingDispatcher
{
    private readonly IBackgroundJobClient _jobs;

    public HangfireArticleEmbeddingDispatcher(IBackgroundJobClient jobs)
    {
        _jobs = jobs;
    }

    public string Enqueue(Guid tenantId, Guid articleId) =>
        _jobs.Enqueue<ArticleEmbeddingJob>(
            job => job.ProcessAsync(tenantId, articleId, CancellationToken.None));
}
