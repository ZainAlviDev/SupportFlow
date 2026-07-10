using SupportFlow.Shared.Contracts.Auth;

namespace SupportFlow.Identity.Application.Common.Interfaces;

public interface ILoginService
{
    Task<LoginResponse> LoginAsync(LoginRequest request, CancellationToken cancellationToken);
}
