using MediatR;
using SupportFlow.Shared.Contracts.Auth;

namespace SupportFlow.Identity.Application.Identity.Commands.Login;

public sealed record LoginCommand(string Email, string Password) : IRequest<LoginResponse>;
