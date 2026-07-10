using MediatR;
using SupportFlow.Identity.Application.Common.Interfaces;
using SupportFlow.Shared.Contracts.Auth;

namespace SupportFlow.Identity.Application.Identity.Commands.Login;

public sealed class LoginCommandHandler : IRequestHandler<LoginCommand, LoginResponse>
{
    private readonly ILoginService _loginService;

    public LoginCommandHandler(ILoginService loginService)
    {
        _loginService = loginService;
    }

    public Task<LoginResponse> Handle(LoginCommand request, CancellationToken cancellationToken)
    {
        var loginRequest = new LoginRequest(request.Email, request.Password);
        return _loginService.LoginAsync(loginRequest, cancellationToken);
    }
}
