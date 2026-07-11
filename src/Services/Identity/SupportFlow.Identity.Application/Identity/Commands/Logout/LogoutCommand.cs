using MediatR;

namespace SupportFlow.Identity.Application.Identity.Commands.Logout;

public sealed record LogoutCommand(string RefreshToken) : IRequest;
