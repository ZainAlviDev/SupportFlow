using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using SupportFlow.AI.Application.Common.Exceptions;
using SupportFlow.Shared.Contracts.Common;
using SupportFlow.Shared.Contracts.Conversations;

namespace SupportFlow.AI.Infrastructure.Gateway;

public sealed class ConversationGatewayClient
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    private readonly HttpClient _httpClient;

    public ConversationGatewayClient(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    public async Task<IReadOnlyList<MessageDto>> GetMessagesAsync(
        Guid conversationId,
        CancellationToken cancellationToken,
        int page = 1,
        int pageSize = 50)
    {
        using var response = await _httpClient.GetAsync(
            $"api/v1/conversations/{conversationId}/messages?page={page}&pageSize={pageSize}",
            cancellationToken);

        if (response.StatusCode == HttpStatusCode.NotFound)
        {
            throw new NotFoundException($"Conversation '{conversationId}' was not found.");
        }

        if (response.StatusCode is HttpStatusCode.Unauthorized or HttpStatusCode.Forbidden)
        {
            throw new UnauthorizedException("The conversation service rejected the caller's credentials.");
        }

        if (!response.IsSuccessStatusCode)
        {
            throw new UpstreamServiceException(
                $"Conversation service returned {(int)response.StatusCode} while loading messages.");
        }

        var payload = await response.Content.ReadFromJsonAsync<ApiResponse<IReadOnlyList<MessageDto>>>(
            JsonOptions,
            cancellationToken)
            ?? throw new UpstreamServiceException("Conversation service returned an empty response.");

        return payload.Data ?? [];
    }
}
