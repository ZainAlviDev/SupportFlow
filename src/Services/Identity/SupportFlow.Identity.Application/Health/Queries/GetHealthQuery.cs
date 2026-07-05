using MediatR;
using SupportFlow.Shared.Contracts.Health;

namespace SupportFlow.Identity.Application.Health.Queries;

public sealed record GetHealthQuery : IRequest<HealthCheckResponse>;
