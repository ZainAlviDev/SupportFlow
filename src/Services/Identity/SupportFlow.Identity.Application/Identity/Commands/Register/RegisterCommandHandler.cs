using MediatR;
using SupportFlow.Identity.Application.Common.Interfaces;
using SupportFlow.Shared.Contracts.Auth;

namespace SupportFlow.Identity.Application.Identity.Commands.Register;

public sealed class RegisterCommandHandler : IRequestHandler<RegisterCommand, RegisterResponse>
{
    private readonly IRegisterService _registerService;

    public RegisterCommandHandler(IRegisterService registerService)
    {
        _registerService = registerService;
    }

    public Task<RegisterResponse> Handle(RegisterCommand request, CancellationToken cancellationToken)
    {
        return _registerService.RegisterAsync(
            new RegisterRequest(
                request.Email,
                request.Password,
                request.FullName,
                request.WorkspaceName,
                request.PhoneNumber),
            cancellationToken);
    }
}
