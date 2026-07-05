using MediatR;
using SupportFlow.Shared.Contracts.Health;

namespace SupportFlow.Customer.Application.Health.Queries;

public sealed record GetHealthQuery : IRequest<HealthCheckResponse>;
