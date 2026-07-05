using MediatR;
using SupportFlow.Shared.Contracts.Health;

namespace SupportFlow.Notification.Application.Health.Queries;

public sealed record GetHealthQuery : IRequest<HealthCheckResponse>;
