using Microsoft.AspNetCore.Identity;
using SupportFlow.Shared.Kernel.Enums;
using SupportFlow.Shared.Kernel.Interfaces;

namespace SupportFlow.Identity.Domain.Entities;

public class User : IdentityUser<Guid>, IAuditableEntity
{
    public string FullName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public Guid? CreatedBy { get; set; }
    public Guid? UpdatedBy { get; set; }
    public bool IsDeleted { get; set; }
    public DateTime? DeletedAt { get; set; }
    public Guid? DeletedBy { get; set; }
    public EntityStatus Status { get; set; } = EntityStatus.Active;
}
