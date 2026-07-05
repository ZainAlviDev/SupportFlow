using MediatR;
using SupportFlow.Shared.Contracts.Health;

namespace SupportFlow.Knowledge.Application.Health.Queries;

public sealed class GetHealthQueryHandler : IRequestHandler<GetHealthQuery, HealthCheckResponse>
{
    public Task<HealthCheckResponse> Handle(GetHealthQuery request, CancellationToken cancellationToken)
    {
        var response = new HealthCheckResponse(
            Service: "Knowledge",
            Status: "Healthy",
            Version: "1.0.0",
            TimestampUtc: DateTime.UtcNow);

        return Task.FromResult(response);
    }
}
