using SupportFlow.Shared.Kernel.Entities;
using SupportFlow.Shared.Kernel.Enums;

namespace SupportFlow.Workspace.Domain.Entities;

public class WorkspaceProfile : AuditableEntity
{
    private WorkspaceProfile()
    {
    }

    public WorkspaceProfile(Guid tenantId, string name, string slug, string timezone = "UTC", string plan = "free")
    {
        Id = tenantId;
        Name = name;
        Slug = slug;
        Timezone = timezone;
        Plan = plan;
        Status = EntityStatus.Active;
    }

    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Timezone { get; set; } = "UTC";
    public string Plan { get; set; } = "free";
    public string? SettingsJson { get; set; }

    public void Update(string? name, string? timezone, string? settingsJson)
    {
        if (!string.IsNullOrWhiteSpace(name))
        {
            Name = name.Trim();
        }

        if (!string.IsNullOrWhiteSpace(timezone))
        {
            Timezone = timezone.Trim();
        }

        if (settingsJson is not null)
        {
            SettingsJson = settingsJson;
        }

        UpdatedAt = DateTime.UtcNow;
    }
}
