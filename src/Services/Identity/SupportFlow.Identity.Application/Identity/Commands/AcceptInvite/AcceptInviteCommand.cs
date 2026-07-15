using MediatR;
using SupportFlow.Shared.Contracts.Auth;

namespace SupportFlow.Identity.Application.Identity.Commands.AcceptInvite;

public sealed record AcceptInviteCommand(
    string Token,
    string? Password,
    string? FullName,
    string? PhoneNumber) : IRequest<LoginResponse>;
