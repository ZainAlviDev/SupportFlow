using MediatR;
using SupportFlow.Shared.Contracts.Workspaces;
using SupportFlow.Workspace.Application.Common.Exceptions;
using SupportFlow.Workspace.Application.Common.Interfaces;

namespace SupportFlow.Workspace.Application.Workspaces.Commands.UpdateCurrentWorkspace;

public sealed class UpdateCurrentWorkspaceCommandHandler : IRequestHandler<UpdateCurrentWorkspaceCommand, WorkspaceDto>
{
    private readonly ICurrentUserService _currentUserService;
    private readonly IWorkspaceService _workspaceService;

    public UpdateCurrentWorkspaceCommandHandler(
        ICurrentUserService currentUserService,
        IWorkspaceService workspaceService)
    {
        _currentUserService = currentUserService;
        _workspaceService = workspaceService;
    }

    public Task<WorkspaceDto> Handle(UpdateCurrentWorkspaceCommand request, CancellationToken cancellationToken)
    {
        if (_currentUserService.TenantId is null)
        {
            throw new UnauthorizedException("Tenant context is required.");
        }

        var role = _currentUserService.Role?.Trim();
        if (!string.Equals(role, "Owner", StringComparison.OrdinalIgnoreCase)
            && !string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase))
        {
            throw new UnauthorizedException("Only workspace owners and admins can update settings.");
        }

        return _workspaceService.UpdateCurrentAsync(
            _currentUserService.TenantId.Value,
            request.Name,
            request.Timezone,
            request.SettingsJson,
            request.Widget,
            request.BusinessHours,
            cancellationToken);
    }
}
