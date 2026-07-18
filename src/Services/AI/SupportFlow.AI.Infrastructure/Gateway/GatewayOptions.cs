namespace SupportFlow.AI.Infrastructure.Gateway;

public sealed class GatewayOptions
{
    public const string SectionName = "Gateway";

    public string BaseUrl { get; init; } = "http://localhost:5000";
}
