using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using SupportFlow.Shared.Contracts.Common;
using SupportFlow.Shared.Contracts.Customers;

namespace SupportFlow.Conversation.Infrastructure.Customers;

public interface ICustomerClient
{
    Task<CustomerDto> UpsertVisitorAsync(
        Guid tenantId,
        string visitorId,
        string? name,
        string? email,
        CancellationToken cancellationToken);
}

public sealed class CustomerClient : ICustomerClient
{
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;

    public CustomerClient(HttpClient httpClient, IConfiguration configuration)
    {
        _httpClient = httpClient;
        _configuration = configuration;
    }

    public async Task<CustomerDto> UpsertVisitorAsync(
        Guid tenantId,
        string visitorId,
        string? name,
        string? email,
        CancellationToken cancellationToken)
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, "api/v1/internal/customers/upsert")
        {
            Content = JsonContent.Create(new CreateCustomerRequest(
                Name: name ?? visitorId,
                Email: email,
                Username: visitorId)),
        };

        request.Headers.TryAddWithoutValidation("X-Tenant-Id", tenantId.ToString());

        var serviceKey = _configuration["Internal:ServiceKey"];
        if (!string.IsNullOrWhiteSpace(serviceKey))
        {
            request.Headers.TryAddWithoutValidation("X-Internal-Key", serviceKey);
        }

        using var response = await _httpClient.SendAsync(request, cancellationToken);
        response.EnsureSuccessStatusCode();
        var envelope = await response.Content.ReadFromJsonAsync<ApiResponse<CustomerDto>>(JsonOptions, cancellationToken);
        return envelope?.Data
            ?? throw new InvalidOperationException("Customer service returned an empty payload.");
    }
}
