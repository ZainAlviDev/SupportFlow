using MediatR;
using SupportFlow.Shared.Contracts.Health;

namespace SupportFlow.Notification.Application.Health.Queries;

public sealed class GetHealthQueryHandler : IRequestHandler<GetHealthQuery, HealthCheckResponse>
{
    public Task<HealthCheckResponse> Handle(GetHealthQuery request, CancellationToken cancellationToken)
    {
        var response = new HealthCheckResponse(
            Service: "Notification",
            Status: "Healthy",
            Version: "1.0.0",
            TimestampUtc: DateTime.UtcNow);

        return Task.FromResult(response);
    }
}
