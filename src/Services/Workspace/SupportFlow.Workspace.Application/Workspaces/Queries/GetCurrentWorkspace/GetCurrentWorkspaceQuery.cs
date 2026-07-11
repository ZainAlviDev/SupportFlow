using MediatR;
using SupportFlow.Shared.Contracts.Workspaces;

namespace SupportFlow.Workspace.Application.Workspaces.Queries.GetCurrentWorkspace;

public sealed record GetCurrentWorkspaceQuery : IRequest<WorkspaceDto>;
