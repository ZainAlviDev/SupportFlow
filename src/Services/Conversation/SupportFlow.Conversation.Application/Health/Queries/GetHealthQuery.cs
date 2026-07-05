using MediatR;
using SupportFlow.Shared.Contracts.Health;

namespace SupportFlow.Conversation.Application.Health.Queries;

public sealed record GetHealthQuery : IRequest<HealthCheckResponse>;
