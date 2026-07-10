using SupportFlow.Identity.Domain.Enums;
using SupportFlow.Shared.Kernel.Enums;
using SupportFlow.Shared.Kernel.Interfaces;

namespace SupportFlow.Identity.Domain.Entities;

public class TenantMember : ITenantEntity, IAuditableEntity
{
    public Guid TenantId { get; set; }
    public Guid UserId { get; set; }
    public TenantRole Role { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public Guid? CreatedBy { get; set; }
    public Guid? UpdatedBy { get; set; }
    public bool IsDeleted { get; set; }
    public DateTime? DeletedAt { get; set; }
    public Guid? DeletedBy { get; set; }
    public EntityStatus Status { get; set; } = EntityStatus.Active;
}
