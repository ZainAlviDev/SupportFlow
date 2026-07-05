using MediatR;
using SupportFlow.Shared.Contracts.Health;

namespace SupportFlow.Workspace.Application.Health.Queries;

public sealed record GetHealthQuery : IRequest<HealthCheckResponse>;
