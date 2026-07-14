using MediatR;
using SupportFlow.Identity.Application.Common.Interfaces;
using SupportFlow.Shared.Contracts.Auth;

namespace SupportFlow.Identity.Application.Identity.Commands.VerifyEmail;

public sealed class VerifyEmailCommandHandler : IRequestHandler<VerifyEmailCommand, LoginResponse>
{
    private readonly IPasswordResetService _passwordResetService;

    public VerifyEmailCommandHandler(IPasswordResetService passwordResetService)
    {
        _passwordResetService = passwordResetService;
    }

    public Task<LoginResponse> Handle(VerifyEmailCommand request, CancellationToken cancellationToken)
    {
        return _passwordResetService.VerifyEmailAsync(
            new VerifyEmailRequest(request.Email, request.Code),
            cancellationToken);
    }
}
