using MediatR;
using SupportFlow.Identity.Application.Common.Interfaces;
using SupportFlow.Shared.Contracts.Auth;

namespace SupportFlow.Identity.Application.Identity.Commands.ForgotPassword;

public sealed class ForgotPasswordCommandHandler
    : IRequestHandler<ForgotPasswordCommand, ForgotPasswordResponse>
{
    private readonly IPasswordResetService _passwordResetService;

    public ForgotPasswordCommandHandler(IPasswordResetService passwordResetService)
    {
        _passwordResetService = passwordResetService;
    }

    public Task<ForgotPasswordResponse> Handle(
        ForgotPasswordCommand request,
        CancellationToken cancellationToken)
    {
        return _passwordResetService.ForgotAsync(
            new ForgotPasswordRequest(request.Channel, request.Email, request.PhoneNumber),
            cancellationToken);
    }
}
