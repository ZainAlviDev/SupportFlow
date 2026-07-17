using SupportFlow.Shared.Kernel.Entities;
using SupportFlow.Shared.Kernel.Interfaces;

namespace SupportFlow.Workspace.Domain.Entities;

public class TenantApiKey : AuditableEntity, ITenantEntity
{
    private TenantApiKey()
    {
    }

    public TenantApiKey(
        Guid tenantId,
        string name,
        string keyPrefix,
        string keyHash,
        string? allowedDomainsJson = null)
    {
        TenantId = tenantId;
        Name = name.Trim();
        KeyPrefix = keyPrefix;
        KeyHash = keyHash;
        AllowedDomainsJson = allowedDomainsJson;
    }

    public Guid TenantId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string KeyPrefix { get; set; } = string.Empty;
    public string KeyHash { get; set; } = string.Empty;
    public string? AllowedDomainsJson { get; set; }
    public DateTime? LastUsedAt { get; set; }
    public DateTime? RevokedAt { get; set; }

    public bool IsRevoked => RevokedAt is not null;

    public void Touch(DateTime utcNow)
    {
        LastUsedAt = utcNow;
        UpdatedAt = utcNow;
    }

    public void Revoke(DateTime utcNow, Guid? revokedBy)
    {
        if (RevokedAt is not null)
        {
            return;
        }

        RevokedAt = utcNow;
        UpdatedAt = utcNow;
        UpdatedBy = revokedBy;
    }
}
