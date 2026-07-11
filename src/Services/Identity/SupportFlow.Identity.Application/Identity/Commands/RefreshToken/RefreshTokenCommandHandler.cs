using MediatR;
using SupportFlow.Identity.Application.Common.Interfaces;
using SupportFlow.Shared.Contracts.Auth;

namespace SupportFlow.Identity.Application.Identity.Commands.RefreshToken;

public sealed class RefreshTokenCommandHandler : IRequestHandler<RefreshTokenCommand, LoginResponse>
{
    private readonly IAuthTokenService _authTokenService;

    public RefreshTokenCommandHandler(IAuthTokenService authTokenService)
    {
        _authTokenService = authTokenService;
    }

    public Task<LoginResponse> Handle(RefreshTokenCommand request, CancellationToken cancellationToken) =>
        _authTokenService.RefreshAsync(request.RefreshToken, cancellationToken);
}
