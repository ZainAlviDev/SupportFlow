using SupportFlow.Shared.Kernel.Interfaces;

namespace SupportFlow.Shared.Kernel.Tenancy;

public sealed class TenantContext : ITenantContext
{
    public Guid TenantId { get; private set; }

    public bool IsResolved { get; private set; }

    public void SetTenant(Guid tenantId)
    {
        if (tenantId == Guid.Empty)
        {
            throw new ArgumentException("Tenant id cannot be empty.", nameof(tenantId));
        }

        TenantId = tenantId;
        IsResolved = true;
    }
}
