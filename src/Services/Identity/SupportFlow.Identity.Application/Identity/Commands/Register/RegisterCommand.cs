using MediatR;
using SupportFlow.Shared.Contracts.Auth;

namespace SupportFlow.Identity.Application.Identity.Commands.Register;

public sealed record RegisterCommand(
    string Email,
    string Password,
    string FullName,
    string WorkspaceName,
    string PhoneNumber) : IRequest<RegisterResponse>;
