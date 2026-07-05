using MediatR;
using SupportFlow.Shared.Contracts.Health;

namespace SupportFlow.Knowledge.Application.Health.Queries;

public sealed record GetHealthQuery : IRequest<HealthCheckResponse>;
