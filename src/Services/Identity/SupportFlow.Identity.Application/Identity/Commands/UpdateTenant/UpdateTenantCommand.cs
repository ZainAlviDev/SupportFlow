using MediatR;
using SupportFlow.Shared.Contracts.Auth;

namespace SupportFlow.Identity.Application.Identity.Commands.UpdateTenant;

public sealed record UpdateTenantCommand(string Name) : IRequest<AuthWorkspaceDto>;
