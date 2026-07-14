using MediatR;

namespace SupportFlow.Identity.Application.Identity.Commands.ResetPassword;

public sealed record ResetPasswordCommand(
    string ResetToken,
    string NewPassword) : IRequest;
