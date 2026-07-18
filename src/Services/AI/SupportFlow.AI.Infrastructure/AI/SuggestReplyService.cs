using System.Net.Http.Json;
using System.Text;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Options;
using SupportFlow.AI.Application.Common.Exceptions;
using SupportFlow.AI.Application.Common.Interfaces;
using SupportFlow.AI.Infrastructure.Gateway;
using SupportFlow.Shared.Contracts.Conversations;
using SupportFlow.Shared.Contracts.Knowledge;

namespace SupportFlow.AI.Infrastructure.AI;

public sealed class SuggestReplyService : ISuggestReplyService
{
    private const int KnowledgeSourceLimit = 5;
    private const int TranscriptMessageLimit = 10;

    private readonly ConversationGatewayClient _conversationClient;
    private readonly KnowledgeGatewayClient _knowledgeClient;
    private readonly HttpClient _azureOpenAiHttpClient;
    private readonly AzureOpenAiOptions _options;
    private readonly ICurrentUserService _currentUser;

    public SuggestReplyService(
        ConversationGatewayClient conversationClient,
        KnowledgeGatewayClient knowledgeClient,
        HttpClient azureOpenAiHttpClient,
        IOptions<AzureOpenAiOptions> options,
        ICurrentUserService currentUser)
    {
        _conversationClient = conversationClient;
        _knowledgeClient = knowledgeClient;
        _azureOpenAiHttpClient = azureOpenAiHttpClient;
        _options = options.Value;
        _currentUser = currentUser;
    }

    public async Task<SuggestReplyResponse> SuggestReplyAsync(
        SuggestReplyRequest request,
        CancellationToken cancellationToken)
    {
        if (_currentUser.TenantId is null || _currentUser.UserId is null)
        {
            throw new UnauthorizedException("Tenant and user context are required.");
        }

        var messages = await _conversationClient.GetMessagesAsync(request.ConversationId, cancellationToken);
        var ordered = messages.OrderBy(message => message.CreatedAt).ToList();
        var latestCustomerMessage = ordered.LastOrDefault(message =>
            string.Equals(message.SenderType, "customer", StringComparison.OrdinalIgnoreCase));

        var query = BuildSearchQuery(request.Prompt, latestCustomerMessage, ordered);
        if (string.IsNullOrWhiteSpace(query))
        {
            throw new ArgumentException(
                "The conversation has no messages and no prompt was provided; nothing to suggest from.");
        }

        var sources = await _knowledgeClient.SearchAsync(query, KnowledgeSourceLimit, cancellationToken);

        string suggestion;
        if (HasAzureConfiguration())
        {
            suggestion = await CreateChatSuggestionAsync(
                ordered,
                request.Prompt,
                sources,
                cancellationToken);
        }
        else if (_options.UseDevelopmentFallback)
        {
            suggestion = CreateDevelopmentSuggestion(latestCustomerMessage, request.Prompt, sources);
        }
        else
        {
            throw new UpstreamServiceException(
                "Azure OpenAI chat configuration is missing and the development fallback is disabled.");
        }

        return new SuggestReplyResponse(suggestion, sources);
    }

    private bool HasAzureConfiguration() =>
        Uri.TryCreate(_options.Endpoint, UriKind.Absolute, out _)
        && !string.IsNullOrWhiteSpace(_options.ApiKey)
        && !string.IsNullOrWhiteSpace(_options.ChatDeployment);

    private static string BuildSearchQuery(
        string? prompt,
        MessageDto? latestCustomerMessage,
        IReadOnlyList<MessageDto> orderedMessages)
    {
        var parts = new List<string>();
        if (!string.IsNullOrWhiteSpace(prompt))
        {
            parts.Add(prompt.Trim());
        }

        var anchorMessage = latestCustomerMessage ?? orderedMessages.LastOrDefault();
        if (!string.IsNullOrWhiteSpace(anchorMessage?.Body))
        {
            parts.Add(anchorMessage.Body.Trim());
        }

        return string.Join("\n", parts);
    }

    private async Task<string> CreateChatSuggestionAsync(
        IReadOnlyList<MessageDto> orderedMessages,
        string? prompt,
        IReadOnlyList<KnowledgeSourceDto> sources,
        CancellationToken cancellationToken)
    {
        var endpoint = _options.Endpoint.TrimEnd('/');
        var url = $"{endpoint}/openai/deployments/{Uri.EscapeDataString(_options.ChatDeployment)}/chat/completions?api-version={Uri.EscapeDataString(_options.ApiVersion)}";

        using var httpRequest = new HttpRequestMessage(HttpMethod.Post, url);
        httpRequest.Headers.Add("api-key", _options.ApiKey);
        httpRequest.Content = JsonContent.Create(new
        {
            messages = new[]
            {
                new { role = "system", content = BuildSystemPrompt(sources) },
                new { role = "user", content = BuildUserPrompt(orderedMessages, prompt) },
            },
            temperature = 0.3,
            max_tokens = 500,
        });

        using var response = await _azureOpenAiHttpClient.SendAsync(httpRequest, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            throw new UpstreamServiceException(
                $"Azure OpenAI returned {(int)response.StatusCode} while generating a suggestion.");
        }

        var payload = await response.Content.ReadFromJsonAsync<ChatCompletionResponse>(
            cancellationToken: cancellationToken)
            ?? throw new UpstreamServiceException("Azure OpenAI returned an empty chat completion response.");

        var suggestion = payload.Choices.FirstOrDefault()?.Message?.Content;
        if (string.IsNullOrWhiteSpace(suggestion))
        {
            throw new UpstreamServiceException("Azure OpenAI returned no chat completion content.");
        }

        return suggestion.Trim();
    }

    private static string BuildSystemPrompt(IReadOnlyList<KnowledgeSourceDto> sources)
    {
        var builder = new StringBuilder();
        builder.AppendLine(
            "You are a helpful customer support agent assistant. " +
            "Draft a concise, friendly, and professional reply that the human agent can send to the customer. " +
            "Use only facts from the knowledge base excerpts below when they are relevant; do not invent policies. " +
            "If the excerpts do not answer the question, acknowledge that and suggest next steps. " +
            "Reply with the draft message only, without any preamble.");

        if (sources.Count > 0)
        {
            builder.AppendLine();
            builder.AppendLine("Knowledge base excerpts:");
            for (var index = 0; index < sources.Count; index++)
            {
                var source = sources[index];
                builder.AppendLine($"[{index + 1}] {source.ArticleTitle}");
                builder.AppendLine(source.Excerpt);
            }
        }
        else
        {
            builder.AppendLine();
            builder.AppendLine("No knowledge base excerpts were found for this conversation.");
        }

        return builder.ToString();
    }

    private static string BuildUserPrompt(IReadOnlyList<MessageDto> orderedMessages, string? prompt)
    {
        var builder = new StringBuilder();
        builder.AppendLine("Conversation transcript (most recent messages):");

        var recent = orderedMessages.TakeLast(TranscriptMessageLimit).ToList();
        if (recent.Count == 0)
        {
            builder.AppendLine("(no messages yet)");
        }

        foreach (var message in recent)
        {
            builder.AppendLine($"{message.SenderType}: {message.Body}");
        }

        if (!string.IsNullOrWhiteSpace(prompt))
        {
            builder.AppendLine();
            builder.AppendLine($"Agent instructions: {prompt.Trim()}");
        }

        builder.AppendLine();
        builder.Append("Draft the next reply to the customer.");
        return builder.ToString();
    }

    private static string CreateDevelopmentSuggestion(
        MessageDto? latestCustomerMessage,
        string? prompt,
        IReadOnlyList<KnowledgeSourceDto> sources)
    {
        var builder = new StringBuilder();
        builder.AppendLine("Hi there,");
        builder.AppendLine();

        if (!string.IsNullOrWhiteSpace(latestCustomerMessage?.Body))
        {
            builder.AppendLine($"Thanks for reaching out about \"{Truncate(latestCustomerMessage.Body, 120)}\".");
        }
        else
        {
            builder.AppendLine("Thanks for reaching out to us.");
        }

        var bestSource = sources.OrderBy(source => source.Distance).FirstOrDefault();
        if (bestSource is not null)
        {
            builder.AppendLine();
            builder.AppendLine($"Based on our article \"{bestSource.ArticleTitle}\":");
            builder.AppendLine(Truncate(bestSource.Excerpt, 400));
        }
        else
        {
            builder.AppendLine();
            builder.AppendLine(
                "I could not find a matching help article for this, so I will check with the team and follow up shortly.");
        }

        if (!string.IsNullOrWhiteSpace(prompt))
        {
            builder.AppendLine();
            builder.AppendLine($"(Agent note applied: {prompt.Trim()})");
        }

        builder.AppendLine();
        builder.AppendLine("Please let me know if this resolves your question or if there is anything else I can help with.");
        builder.Append("Best regards");
        return builder.ToString();
    }

    private static string Truncate(string value, int maxLength)
    {
        var trimmed = value.Trim();
        return trimmed.Length <= maxLength ? trimmed : trimmed[..maxLength].TrimEnd() + "…";
    }

    private sealed record ChatCompletionResponse(
        [property: JsonPropertyName("choices")] IReadOnlyList<ChatChoice> Choices);

    private sealed record ChatChoice(
        [property: JsonPropertyName("message")] ChatMessage? Message);

    private sealed record ChatMessage(
        [property: JsonPropertyName("content")] string? Content);
}
