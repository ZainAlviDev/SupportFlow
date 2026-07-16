using MediatR;
using SupportFlow.Shared.Contracts.Auth;

namespace SupportFlow.Identity.Application.Identity.Commands.VerifyEmail;

public sealed record VerifyEmailCommand(string Email, string Code) : IRequest<LoginResponse>;
