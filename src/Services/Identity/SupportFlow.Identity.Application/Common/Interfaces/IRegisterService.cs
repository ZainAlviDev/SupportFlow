using SupportFlow.Shared.Contracts.Auth;

namespace SupportFlow.Identity.Application.Common.Interfaces;

public interface IRegisterService
{
    Task<LoginResponse> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken);
}
