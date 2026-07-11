using MediatR;
using SupportFlow.Identity.Application.Common.Interfaces;

namespace SupportFlow.Identity.Application.Identity.Commands.Logout;

public sealed class LogoutCommandHandler : IRequestHandler<LogoutCommand>
{
    private readonly IAuthTokenService _authTokenService;

    public LogoutCommandHandler(IAuthTokenService authTokenService)
    {
        _authTokenService = authTokenService;
    }

    public async Task Handle(LogoutCommand request, CancellationToken cancellationToken)
    {
        await _authTokenService.LogoutAsync(request.RefreshToken, cancellationToken);
    }
}
