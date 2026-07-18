using SupportFlow.Shared.Contracts.Knowledge;

namespace SupportFlow.Knowledge.Application.Common.Interfaces;

public interface IKnowledgeSearchService
{
    Task<IReadOnlyList<KnowledgeSourceDto>> SearchAsync(
        Guid tenantId,
        string query,
        int limit,
        CancellationToken cancellationToken);
}
