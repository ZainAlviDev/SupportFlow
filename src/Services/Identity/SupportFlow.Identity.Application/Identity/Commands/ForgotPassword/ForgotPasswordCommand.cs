using MediatR;
using SupportFlow.Shared.Contracts.Auth;

namespace SupportFlow.Identity.Application.Identity.Commands.ForgotPassword;

public sealed record ForgotPasswordCommand(
    string Channel,
    string? Email,
    string? PhoneNumber) : IRequest<ForgotPasswordResponse>;
