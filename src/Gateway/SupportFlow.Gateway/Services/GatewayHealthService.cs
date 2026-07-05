namespace SupportFlow.Gateway.Services;

public sealed class GatewayHealthService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;

    public GatewayHealthService(IHttpClientFactory httpClientFactory, IConfiguration configuration)
    {
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
    }

    public async Task<GatewayHealthReport> CheckAllServicesAsync(CancellationToken cancellationToken)
    {
        var services = _configuration.GetSection("Services").GetChildren();
        var client = _httpClientFactory.CreateClient();
        client.Timeout = TimeSpan.FromSeconds(5);

        var results = new List<ServiceHealthStatus>();

        foreach (var service in services)
        {
            var baseUrl = service.Value?.TrimEnd('/');
            var name = service.Key;
            var status = "Unhealthy";
            string? detail = null;

            if (!string.IsNullOrEmpty(baseUrl))
            {
                try
                {
                    var response = await client.GetAsync($"{baseUrl}/health", cancellationToken);
                    status = response.IsSuccessStatusCode ? "Healthy" : "Unhealthy";
                    if (!response.IsSuccessStatusCode)
                        detail = $"HTTP {(int)response.StatusCode}";
                }
                catch (Exception ex)
                {
                    detail = ex.Message;
                }
            }

            results.Add(new ServiceHealthStatus(name, status, baseUrl ?? "", detail));
        }

        return new GatewayHealthReport(
            Gateway: "SupportFlow.Gateway",
            Status: results.All(r => r.Status == "Healthy") ? "Healthy" : "Degraded",
            TimestampUtc: DateTime.UtcNow,
            Services: results);
    }
}

public sealed record ServiceHealthStatus(string Service, string Status, string Url, string? Detail);

public sealed record GatewayHealthReport(
    string Gateway,
    string Status,
    DateTime TimestampUtc,
    IReadOnlyList<ServiceHealthStatus> Services)
{
    public bool AllHealthy => Services.All(s => s.Status == "Healthy");
}
