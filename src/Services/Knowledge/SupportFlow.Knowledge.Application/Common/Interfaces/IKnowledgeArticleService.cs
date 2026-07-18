using SupportFlow.Shared.Contracts.Knowledge;

namespace SupportFlow.Knowledge.Application.Common.Interfaces;

public interface IKnowledgeArticleService
{
    Task<IReadOnlyList<KnowledgeArticleDto>> ListAsync(
        Guid tenantId,
        string? search,
        string? status,
        string? category,
        int page,
        int pageSize,
        CancellationToken cancellationToken);

    Task<KnowledgeArticleDto?> GetByIdAsync(
        Guid tenantId,
        Guid articleId,
        CancellationToken cancellationToken);

    Task<KnowledgeArticleDto> CreateAsync(
        Guid tenantId,
        Guid? createdBy,
        CreateKnowledgeArticleRequest request,
        CancellationToken cancellationToken);

    Task<KnowledgeArticleDto> UpdateAsync(
        Guid tenantId,
        Guid articleId,
        Guid? updatedBy,
        UpdateKnowledgeArticleRequest request,
        CancellationToken cancellationToken);

    Task DeleteAsync(
        Guid tenantId,
        Guid articleId,
        Guid? deletedBy,
        CancellationToken cancellationToken);
}
