using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using SupportFlow.Shared.Contracts.Workspaces;
using SupportFlow.Shared.Kernel.Enums;
using SupportFlow.Workspace.Application.Common.Exceptions;
using SupportFlow.Workspace.Application.Common.Interfaces;
using SupportFlow.Workspace.Domain.Entities;
using SupportFlow.Workspace.Infrastructure.Persistence;

namespace SupportFlow.Workspace.Infrastructure.Workspaces;

public sealed class ApiKeyService : IApiKeyService
{
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

    private readonly WorkspaceDbContext _dbContext;

    public ApiKeyService(WorkspaceDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IReadOnlyList<ApiKeyDto>> ListAsync(Guid tenantId, CancellationToken cancellationToken)
    {
        var keys = await _dbContext.ApiKeys
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Where(k => k.TenantId == tenantId && !k.IsDeleted && k.RevokedAt == null)
            .OrderByDescending(k => k.CreatedAt)
            .ToListAsync(cancellationToken);

        return keys.Select(Map).ToList();
    }

    public async Task<CreatedApiKeyDto> CreateAsync(
        Guid tenantId,
        Guid? createdBy,
        string name,
        IReadOnlyList<string>? allowedDomains,
        CancellationToken cancellationToken)
    {
        var workspace = await _dbContext.Workspaces
            .IgnoreQueryFilters()
            .AsNoTracking()
            .FirstOrDefaultAsync(w => w.Id == tenantId && !w.IsDeleted, cancellationToken)
            ?? throw new NotFoundException("Workspace not found.");

        var rawKey = GenerateRawKey();
        var prefix = rawKey[..12];
        var hash = HashKey(rawKey);
        var domainsJson = SerializeDomains(allowedDomains);

        var entity = new TenantApiKey(tenantId, name, prefix, hash, domainsJson)
        {
            CreatedBy = createdBy,
            Status = EntityStatus.Active,
        };

        _dbContext.ApiKeys.Add(entity);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return new CreatedApiKeyDto(
            entity.Id,
            entity.Name,
            entity.KeyPrefix,
            rawKey,
            DeserializeDomains(entity.AllowedDomainsJson),
            entity.CreatedAt);
    }

    public async Task RevokeAsync(Guid tenantId, Guid apiKeyId, Guid? revokedBy, CancellationToken cancellationToken)
    {
        var entity = await _dbContext.ApiKeys
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(k => k.Id == apiKeyId && k.TenantId == tenantId && !k.IsDeleted, cancellationToken)
            ?? throw new NotFoundException("API key not found.");

        entity.Revoke(DateTime.UtcNow, revokedBy);
        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<ValidateApiKeyResponse?> ValidateAsync(string apiKey, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            return null;
        }

        var hash = HashKey(apiKey.Trim());
        var entity = await _dbContext.ApiKeys
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(
                k => k.KeyHash == hash && !k.IsDeleted && k.RevokedAt == null,
                cancellationToken);

        if (entity is null)
        {
            return null;
        }

        var workspace = await _dbContext.Workspaces
            .IgnoreQueryFilters()
            .AsNoTracking()
            .FirstOrDefaultAsync(w => w.Id == entity.TenantId && !w.IsDeleted, cancellationToken);

        if (workspace is null)
        {
            return null;
        }

        entity.Touch(DateTime.UtcNow);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return new ValidateApiKeyResponse(
            entity.TenantId,
            entity.Id,
            workspace.Name,
            workspace.SettingsJson,
            DeserializeDomains(entity.AllowedDomainsJson));
    }

    private static string GenerateRawKey()
    {
        var bytes = RandomNumberGenerator.GetBytes(32);
        var token = Convert.ToBase64String(bytes)
            .TrimEnd('=')
            .Replace('+', '-')
            .Replace('/', '_');
        return $"pk_live_{token}";
    }

    public static string HashKey(string apiKey)
    {
        var hash = SHA256.HashData(Encoding.UTF8.GetBytes(apiKey));
        return Convert.ToHexString(hash).ToLowerInvariant();
    }

    private static string? SerializeDomains(IReadOnlyList<string>? domains)
    {
        if (domains is null || domains.Count == 0)
        {
            return null;
        }

        var cleaned = domains
            .Where(d => !string.IsNullOrWhiteSpace(d))
            .Select(d => d.Trim().ToLowerInvariant())
            .Distinct()
            .ToList();

        return cleaned.Count == 0 ? null : JsonSerializer.Serialize(cleaned, JsonOptions);
    }

    private static IReadOnlyList<string> DeserializeDomains(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
        {
            return Array.Empty<string>();
        }

        try
        {
            return JsonSerializer.Deserialize<List<string>>(json, JsonOptions) ?? [];
        }
        catch
        {
            return Array.Empty<string>();
        }
    }

    private static ApiKeyDto Map(TenantApiKey key) =>
        new(
            key.Id,
            key.Name,
            key.KeyPrefix,
            DeserializeDomains(key.AllowedDomainsJson),
            key.CreatedAt,
            key.LastUsedAt,
            key.RevokedAt);
}
