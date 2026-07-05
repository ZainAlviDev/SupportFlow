using MediatR;
using SupportFlow.Shared.Contracts.Health;

namespace SupportFlow.Ticket.Application.Health.Queries;

public sealed record GetHealthQuery : IRequest<HealthCheckResponse>;
