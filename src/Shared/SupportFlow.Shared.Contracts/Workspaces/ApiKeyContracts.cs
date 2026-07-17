namespace SupportFlow.Shared.Contracts.Workspaces;

public sealed record CreateApiKeyRequest(string Name, IReadOnlyList<string>? AllowedDomains = null);

public sealed record ApiKeyDto(
    Guid Id,
    string Name,
    string KeyPrefix,
    IReadOnlyList<string> AllowedDomains,
    DateTime CreatedAt,
    DateTime? LastUsedAt,
    DateTime? RevokedAt);

/// <summary>Returned only once when a key is created.</summary>
public sealed record CreatedApiKeyDto(
    Guid Id,
    string Name,
    string KeyPrefix,
    string ApiKey,
    IReadOnlyList<string> AllowedDomains,
    DateTime CreatedAt);

public sealed record ValidateApiKeyRequest(string ApiKey);

public sealed record ValidateApiKeyResponse(
    Guid TenantId,
    Guid ApiKeyId,
    string WorkspaceName,
    string? SettingsJson,
    IReadOnlyList<string> AllowedDomains);
