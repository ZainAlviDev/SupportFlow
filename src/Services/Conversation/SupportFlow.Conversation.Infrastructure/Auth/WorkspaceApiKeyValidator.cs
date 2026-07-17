using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using SupportFlow.Shared.Contracts.Common;
using SupportFlow.Shared.Contracts.Workspaces;

namespace SupportFlow.Conversation.Infrastructure.Auth;

public interface IApiKeyValidator
{
    Task<ValidateApiKeyResponse?> ValidateAsync(string apiKey, CancellationToken cancellationToken);
}

public sealed class WorkspaceApiKeyValidator : IApiKeyValidator
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;

    public WorkspaceApiKeyValidator(HttpClient httpClient, IConfiguration configuration)
    {
        _httpClient = httpClient;
        _configuration = configuration;
    }

    public async Task<ValidateApiKeyResponse?> ValidateAsync(string apiKey, CancellationToken cancellationToken)
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, "api/v1/internal/api-keys/validate")
        {
            Content = JsonContent.Create(new ValidateApiKeyRequest(apiKey)),
        };

        var serviceKey = _configuration["Internal:ServiceKey"];
        if (!string.IsNullOrWhiteSpace(serviceKey))
        {
            request.Headers.TryAddWithoutValidation("X-Internal-Key", serviceKey);
        }

        using var response = await _httpClient.SendAsync(request, cancellationToken);
        if (response.StatusCode == System.Net.HttpStatusCode.Unauthorized)
        {
            return null;
        }

        response.EnsureSuccessStatusCode();
        var envelope = await response.Content.ReadFromJsonAsync<ApiResponse<ValidateApiKeyResponse>>(JsonOptions, cancellationToken);
        return envelope?.Data;
    }
}
