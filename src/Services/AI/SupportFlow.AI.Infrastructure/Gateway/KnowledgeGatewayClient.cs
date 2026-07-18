using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using SupportFlow.AI.Application.Common.Exceptions;
using SupportFlow.Shared.Contracts.Common;
using SupportFlow.Shared.Contracts.Knowledge;

namespace SupportFlow.AI.Infrastructure.Gateway;

public sealed class KnowledgeGatewayClient
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    private readonly HttpClient _httpClient;

    public KnowledgeGatewayClient(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    public async Task<IReadOnlyList<KnowledgeSourceDto>> SearchAsync(
        string query,
        int limit,
        CancellationToken cancellationToken)
    {
        using var response = await _httpClient.PostAsJsonAsync(
            "api/v1/knowledge/search",
            new KnowledgeSearchRequest(query, limit),
            JsonOptions,
            cancellationToken);

        if (response.StatusCode is HttpStatusCode.Unauthorized or HttpStatusCode.Forbidden)
        {
            throw new UnauthorizedException("The knowledge service rejected the caller's credentials.");
        }

        if (!response.IsSuccessStatusCode)
        {
            throw new UpstreamServiceException(
                $"Knowledge service returned {(int)response.StatusCode} while searching articles.");
        }

        var payload = await response.Content.ReadFromJsonAsync<ApiResponse<IReadOnlyList<KnowledgeSourceDto>>>(
            JsonOptions,
            cancellationToken)
            ?? throw new UpstreamServiceException("Knowledge service returned an empty response.");

        return payload.Data ?? [];
    }
}
