using SupportFlow.Shared.Contracts.Auth;

namespace SupportFlow.Identity.Application.Common.Interfaces;

public interface IAuthTokenService
{
    Task<LoginResponse> RefreshAsync(string refreshToken, CancellationToken cancellationToken);
    Task LogoutAsync(string refreshToken, CancellationToken cancellationToken);
}
