using SupportFlow.Shared.Contracts.Workspaces;

namespace SupportFlow.Workspace.Application.Common.Interfaces;

public interface ICurrentUserService
{
    Guid? UserId { get; }
    Guid? TenantId { get; }
    string? Role { get; }
}

public interface IWorkspaceService
{
    Task<WorkspaceDto> CreateAsync(Guid tenantId, string name, string? slug, string? timezone, CancellationToken cancellationToken);
    Task<WorkspaceDto> GetCurrentAsync(Guid tenantId, CancellationToken cancellationToken);
    Task<WorkspaceDto> UpdateCurrentAsync(Guid tenantId, string? name, string? timezone, string? settingsJson, CancellationToken cancellationToken);
}
