using MediatR;
using SupportFlow.Shared.Contracts.Workspaces;

namespace SupportFlow.Workspace.Application.Workspaces.Commands.UpdateCurrentWorkspace;

public sealed record UpdateCurrentWorkspaceCommand(
    string? Name,
    string? Timezone,
    string? SettingsJson,
    WidgetSettingsDto? Widget = null,
    BusinessHoursSettingsDto? BusinessHours = null) : IRequest<WorkspaceDto>;
