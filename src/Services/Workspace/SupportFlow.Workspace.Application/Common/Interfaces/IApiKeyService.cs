using SupportFlow.Shared.Contracts.Workspaces;

namespace SupportFlow.Workspace.Application.Common.Interfaces;

public interface IApiKeyService
{
    Task<IReadOnlyList<ApiKeyDto>> ListAsync(Guid tenantId, CancellationToken cancellationToken);

    Task<CreatedApiKeyDto> CreateAsync(
        Guid tenantId,
        Guid? createdBy,
        string name,
        IReadOnlyList<string>? allowedDomains,
        CancellationToken cancellationToken);

    Task RevokeAsync(Guid tenantId, Guid apiKeyId, Guid? revokedBy, CancellationToken cancellationToken);

    Task<ValidateApiKeyResponse?> ValidateAsync(string apiKey, CancellationToken cancellationToken);
}
