namespace SupportFlow.Shared.Contracts.Health;

public sealed record HealthCheckResponse(
    string Service,
    string Status,
    string Version,
    DateTime TimestampUtc);
