using MediatR;
using SupportFlow.Shared.Contracts.Workspaces;
using SupportFlow.Workspace.Application.Common.Exceptions;
using SupportFlow.Workspace.Application.Common.Interfaces;

namespace SupportFlow.Workspace.Application.Workspaces.Commands.CreateWorkspace;

public sealed class CreateWorkspaceCommandHandler : IRequestHandler<CreateWorkspaceCommand, WorkspaceDto>
{
    private readonly ICurrentUserService _currentUserService;
    private readonly IWorkspaceService _workspaceService;

    public CreateWorkspaceCommandHandler(
        ICurrentUserService currentUserService,
        IWorkspaceService workspaceService)
    {
        _currentUserService = currentUserService;
        _workspaceService = workspaceService;
    }

    public Task<WorkspaceDto> Handle(CreateWorkspaceCommand request, CancellationToken cancellationToken)
    {
        if (_currentUserService.TenantId is null)
        {
            throw new UnauthorizedException("Tenant context is required.");
        }

        return _workspaceService.CreateAsync(
            _currentUserService.TenantId.Value,
            request.Name,
            request.Slug,
            request.Timezone,
            cancellationToken);
    }
}
