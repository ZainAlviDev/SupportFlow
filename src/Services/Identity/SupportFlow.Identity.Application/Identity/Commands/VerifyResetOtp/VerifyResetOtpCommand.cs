using MediatR;
using SupportFlow.Shared.Contracts.Auth;

namespace SupportFlow.Identity.Application.Identity.Commands.VerifyResetOtp;

public sealed record VerifyResetOtpCommand(
    string Channel,
    string Code,
    string? Email,
    string? PhoneNumber) : IRequest<VerifyResetOtpResponse>;
