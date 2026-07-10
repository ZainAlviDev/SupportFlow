using SupportFlow.Shared.Kernel.Entities;

namespace SupportFlow.Identity.Domain.Entities;

public class Tenant : AuditableEntity
{
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Plan { get; set; } = "free";
}
