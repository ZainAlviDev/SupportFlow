namespace SupportFlow.Shared.Contracts.Workspaces;

public sealed record CreateWorkspaceRequest(string Name, string? Slug = null, string? Timezone = null);

public sealed record UpdateWorkspaceRequest(string? Name, string? Timezone, string? SettingsJson);

public sealed record WorkspaceDto(
    Guid Id,
    string Name,
    string Slug,
    string Timezone,
    string Plan,
    string? SettingsJson,
    DateTime CreatedAt);
