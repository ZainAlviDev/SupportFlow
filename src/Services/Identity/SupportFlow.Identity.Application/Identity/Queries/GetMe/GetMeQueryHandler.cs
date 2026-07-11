using MediatR;
using SupportFlow.Identity.Application.Common.Exceptions;
using SupportFlow.Identity.Application.Common.Interfaces;
using SupportFlow.Shared.Contracts.Auth;

namespace SupportFlow.Identity.Application.Identity.Queries.GetMe;

public sealed class GetMeQueryHandler : IRequestHandler<GetMeQuery, MeResponse>
{
    private readonly ICurrentUserService _currentUserService;
    private readonly IUserProfileService _userProfileService;

    public GetMeQueryHandler(ICurrentUserService currentUserService, IUserProfileService userProfileService)
    {
        _currentUserService = currentUserService;
        _userProfileService = userProfileService;
    }

    public Task<MeResponse> Handle(GetMeQuery request, CancellationToken cancellationToken)
    {
        if (_currentUserService.UserId is null || _currentUserService.TenantId is null)
        {
            throw new UnauthorizedException("Authentication is required.");
        }

        return _userProfileService.GetMeAsync(
            _currentUserService.UserId.Value,
            _currentUserService.TenantId.Value,
            cancellationToken);
    }
}
