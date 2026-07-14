using MediatR;
using SupportFlow.Shared.Contracts.Auth;

namespace SupportFlow.Identity.Application.Identity.Commands.GetRecoveryOptions;

public sealed record GetRecoveryOptionsCommand(string Email) : IRequest<RecoveryOptionsResponse>;
