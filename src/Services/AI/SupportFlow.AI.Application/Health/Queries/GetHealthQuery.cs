using MediatR;
using SupportFlow.Shared.Contracts.Health;

namespace SupportFlow.AI.Application.Health.Queries;

public sealed record GetHealthQuery : IRequest<HealthCheckResponse>;
