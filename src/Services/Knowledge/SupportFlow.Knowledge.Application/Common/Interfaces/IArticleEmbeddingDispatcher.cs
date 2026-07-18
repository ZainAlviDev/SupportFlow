namespace SupportFlow.Knowledge.Application.Common.Interfaces;

public interface IArticleEmbeddingDispatcher
{
    string Enqueue(Guid tenantId, Guid articleId);
}
