using MediatR;
using SupportFlow.Identity.Application.Common.Exceptions;
using SupportFlow.Identity.Application.Common.Interfaces;
using SupportFlow.Shared.Contracts.Auth;

namespace SupportFlow.Identity.Application.Identity.Commands.UpdateTenant;

public sealed class UpdateTenantCommandHandler : IRequestHandler<UpdateTenantCommand, AuthWorkspaceDto>
{
    private readonly ICurrentUserService _currentUserService;
    private readonly IUserProfileService _userProfileService;

    public UpdateTenantCommandHandler(
        ICurrentUserService currentUserService,
        IUserProfileService userProfileService)
    {
        _currentUserService = currentUserService;
        _userProfileService = userProfileService;
    }

    public Task<AuthWorkspaceDto> Handle(UpdateTenantCommand request, CancellationToken cancellationToken)
    {
        if (_currentUserService.UserId is null || _currentUserService.TenantId is null)
        {
            throw new UnauthorizedException("Authentication is required.");
        }

        return _userProfileService.UpdateTenantNameAsync(
            _currentUserService.UserId.Value,
            _currentUserService.TenantId.Value,
            request.Name,
            cancellationToken);
    }
}
