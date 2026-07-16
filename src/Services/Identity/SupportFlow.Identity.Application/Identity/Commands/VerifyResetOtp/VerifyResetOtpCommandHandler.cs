using MediatR;
using SupportFlow.Identity.Application.Common.Interfaces;
using SupportFlow.Shared.Contracts.Auth;

namespace SupportFlow.Identity.Application.Identity.Commands.VerifyResetOtp;

public sealed class VerifyResetOtpCommandHandler
    : IRequestHandler<VerifyResetOtpCommand, VerifyResetOtpResponse>
{
    private readonly IPasswordResetService _passwordResetService;

    public VerifyResetOtpCommandHandler(IPasswordResetService passwordResetService)
    {
        _passwordResetService = passwordResetService;
    }

    public Task<VerifyResetOtpResponse> Handle(
        VerifyResetOtpCommand request,
        CancellationToken cancellationToken)
    {
        return _passwordResetService.VerifyOtpAsync(
            new VerifyResetOtpRequest(request.Channel, request.Code, request.Email, request.PhoneNumber),
            cancellationToken);
    }
}
