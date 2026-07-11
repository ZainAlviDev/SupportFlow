using MediatR;
using SupportFlow.Shared.Contracts.Workspaces;

namespace SupportFlow.Workspace.Application.Workspaces.Commands.CreateWorkspace;

public sealed record CreateWorkspaceCommand(string Name, string? Slug, string? Timezone) : IRequest<WorkspaceDto>;
