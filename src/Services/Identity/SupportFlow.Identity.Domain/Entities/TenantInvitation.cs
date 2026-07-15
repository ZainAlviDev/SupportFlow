using SupportFlow.Identity.Domain.Enums;
using SupportFlow.Shared.Kernel.Entities;
using SupportFlow.Shared.Kernel.Interfaces;

namespace SupportFlow.Identity.Domain.Entities;

public class TenantInvitation : AuditableEntity, ITenantEntity
{
    public Guid TenantId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string NormalizedEmail { get; set; } = string.Empty;
    public TenantRole Role { get; set; } = TenantRole.Agent;
    public string TokenHash { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public Guid InvitedByUserId { get; set; }
    public DateTime? AcceptedAt { get; set; }
}
