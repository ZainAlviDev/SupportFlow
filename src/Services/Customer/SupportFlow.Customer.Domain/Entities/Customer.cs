using SupportFlow.Shared.Kernel.Entities;
using SupportFlow.Shared.Kernel.Interfaces;

namespace SupportFlow.Customer.Domain.Entities;

public class Customer : AuditableEntity, ITenantEntity
{
    private Customer()
    {
    }

    public Customer(
        Guid tenantId,
        DateTime firstSeenAt,
        string? email = null,
        string? name = null,
        string? externalId = null)
    {
        TenantId = tenantId;
        Email = string.IsNullOrWhiteSpace(email) ? null : email.Trim();
        Name = string.IsNullOrWhiteSpace(name) ? null : name.Trim();
        ExternalId = string.IsNullOrWhiteSpace(externalId) ? null : externalId.Trim();
        FirstSeenAt = firstSeenAt;
        LastSeenAt = firstSeenAt;
    }

    public Guid TenantId { get; set; }
    public string? Email { get; set; }
    public string? Name { get; set; }
    public string? ExternalId { get; set; }
    public string? MetadataJson { get; set; }
    public DateTime FirstSeenAt { get; set; }
    public DateTime LastSeenAt { get; set; }
    public string? TagsJson { get; set; }

    public void Touch(DateTime seenAt)
    {
        LastSeenAt = seenAt;
        UpdatedAt = seenAt;
    }
}
