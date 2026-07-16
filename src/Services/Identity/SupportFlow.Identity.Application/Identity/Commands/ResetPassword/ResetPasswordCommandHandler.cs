using MediatR;
using SupportFlow.Identity.Application.Common.Interfaces;
using SupportFlow.Shared.Contracts.Auth;

namespace SupportFlow.Identity.Application.Identity.Commands.ResetPassword;

public sealed class ResetPasswordCommandHandler : IRequestHandler<ResetPasswordCommand>
{
    private readonly IPasswordResetService _passwordResetService;

    public ResetPasswordCommandHandler(IPasswordResetService passwordResetService)
    {
        _passwordResetService = passwordResetService;
    }

    public Task Handle(ResetPasswordCommand request, CancellationToken cancellationToken)
    {
        return _passwordResetService.ResetAsync(
            new ResetPasswordRequest(request.ResetToken, request.NewPassword),
            cancellationToken);
    }
}
