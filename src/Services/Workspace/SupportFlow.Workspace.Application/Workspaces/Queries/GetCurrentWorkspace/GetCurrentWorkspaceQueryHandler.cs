using MediatR;
using SupportFlow.Shared.Contracts.Workspaces;
using SupportFlow.Workspace.Application.Common.Exceptions;
using SupportFlow.Workspace.Application.Common.Interfaces;

namespace SupportFlow.Workspace.Application.Workspaces.Queries.GetCurrentWorkspace;

public sealed class GetCurrentWorkspaceQueryHandler : IRequestHandler<GetCurrentWorkspaceQuery, WorkspaceDto>
{
    private readonly ICurrentUserService _currentUserService;
    private readonly IWorkspaceService _workspaceService;

    public GetCurrentWorkspaceQueryHandler(
        ICurrentUserService currentUserService,
        IWorkspaceService workspaceService)
    {
        _currentUserService = currentUserService;
        _workspaceService = workspaceService;
    }

    public Task<WorkspaceDto> Handle(GetCurrentWorkspaceQuery request, CancellationToken cancellationToken)
    {
        if (_currentUserService.TenantId is null)
        {
            throw new UnauthorizedException("Tenant context is required.");
        }

        return _workspaceService.GetCurrentAsync(_currentUserService.TenantId.Value, cancellationToken);
    }
}
