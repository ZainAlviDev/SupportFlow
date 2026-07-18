using System.Security.Claims;
using System.Text.Json;
using SupportFlow.Conversation.Application.Common.Exceptions;
using SupportFlow.Conversation.Application.Common.Interfaces;
using SupportFlow.Conversation.Infrastructure.Customers;
using SupportFlow.Shared.Contracts.Widget;

namespace SupportFlow.Conversation.Infrastructure.Widget;

public interface IWidgetService
{
    WidgetConfigDto GetConfig(ClaimsPrincipal user);

    Task<WidgetConversationDto> StartOrResumeAsync(
        Guid tenantId,
        StartWidgetConversationRequest request,
        CancellationToken cancellationToken);

    Task<WidgetMessageDto> SendMessageAsync(
        Guid tenantId,
        Guid conversationId,
        string visitorId,
        string body,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<WidgetMessageDto>> ListMessagesAsync(
        Guid tenantId,
        Guid conversationId,
        int page,
        int pageSize,
        CancellationToken cancellationToken);
}

public sealed class WidgetService : IWidgetService
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    private readonly IConversationService _conversations;
    private readonly ICustomerClient _customers;

    public WidgetService(
        IConversationService conversations,
        ICustomerClient customers)
    {
        _conversations = conversations;
        _customers = customers;
    }

    public WidgetConfigDto GetConfig(ClaimsPrincipal user)
    {
        var workspaceName = user.FindFirstValue("workspace_name") ?? "Support";
        var settingsJson = user.FindFirstValue("workspace_settings");
        var branding = ParseBranding(settingsJson);

        return new WidgetConfigDto(
            workspaceName,
            branding.PrimaryColor,
            branding.Position,
            branding.WelcomeMessage,
            branding.PreChatEnabled);
    }

    public async Task<WidgetConversationDto> StartOrResumeAsync(
        Guid tenantId,
        StartWidgetConversationRequest request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.VisitorId))
        {
            throw new ConflictException("VisitorId is required.");
        }

        var customer = await _customers.UpsertVisitorAsync(
            tenantId,
            request.VisitorId.Trim(),
            request.Name,
            request.Email,
            cancellationToken);

        var existing = await _conversations.FindOpenByCustomerAsync(tenantId, customer.Id, cancellationToken);
        if (existing is not null)
        {
            if (!string.IsNullOrWhiteSpace(request.InitialMessage))
            {
                await _conversations.SendMessageAsync(
                    tenantId,
                    existing.Id,
                    customer.Id,
                    request.InitialMessage,
                    "Customer",
                    isAiGenerated: false,
                    cancellationToken);
                existing = await _conversations.GetByIdAsync(tenantId, existing.Id, cancellationToken);
            }

            return MapConversation(existing);
        }

        var created = await _conversations.CreateAsync(
            tenantId,
            actorUserId: null,
            customer.Id,
            channel: "WebChat",
            assigneeId: null,
            tags: null,
            initialMessage: null,
            cancellationToken);

        if (!string.IsNullOrWhiteSpace(request.InitialMessage))
        {
            await _conversations.SendMessageAsync(
                tenantId,
                created.Id,
                customer.Id,
                request.InitialMessage,
                "Customer",
                isAiGenerated: false,
                cancellationToken);
            created = await _conversations.GetByIdAsync(tenantId, created.Id, cancellationToken);
        }

        return MapConversation(created);
    }

    public async Task<WidgetMessageDto> SendMessageAsync(
        Guid tenantId,
        Guid conversationId,
        string visitorId,
        string body,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(visitorId))
        {
            throw new ConflictException("VisitorId is required.");
        }

        var customer = await _customers.UpsertVisitorAsync(
            tenantId,
            visitorId.Trim(),
            name: null,
            email: null,
            cancellationToken);

        var conversation = await _conversations.GetByIdAsync(tenantId, conversationId, cancellationToken);
        if (conversation.CustomerId != customer.Id)
        {
            throw new UnauthorizedException("Conversation does not belong to this visitor.");
        }

        var message = await _conversations.SendMessageAsync(
            tenantId,
            conversationId,
            customer.Id,
            body,
            "Customer",
            isAiGenerated: false,
            cancellationToken);

        return new WidgetMessageDto(
            message.Id,
            message.ConversationId,
            message.SenderType,
            message.Body,
            message.CreatedAt);
    }

    public async Task<IReadOnlyList<WidgetMessageDto>> ListMessagesAsync(
        Guid tenantId,
        Guid conversationId,
        int page,
        int pageSize,
        CancellationToken cancellationToken)
    {
        var result = await _conversations.ListMessagesAsync(tenantId, conversationId, page, pageSize, cancellationToken);
        return result.Items
            .Select(m => new WidgetMessageDto(m.Id, m.ConversationId, m.SenderType, m.Body, m.CreatedAt))
            .ToList();
    }

    private static WidgetConversationDto MapConversation(SupportFlow.Shared.Contracts.Conversations.ConversationDto dto) =>
        new(dto.Id, dto.CustomerId, dto.Status, dto.LastMessageAt, dto.CreatedAt);

    private static Branding ParseBranding(string? settingsJson)
    {
        var defaults = new Branding("#10b981", "bottom-right", "Hi! How can we help?", false);
        if (string.IsNullOrWhiteSpace(settingsJson))
        {
            return defaults;
        }

        try
        {
            using var doc = JsonDocument.Parse(settingsJson);
            if (!doc.RootElement.TryGetProperty("widget", out var widget))
            {
                return defaults;
            }

            return new Branding(
                widget.TryGetProperty("primaryColor", out var color) ? color.GetString() ?? defaults.PrimaryColor : defaults.PrimaryColor,
                widget.TryGetProperty("position", out var position) ? position.GetString() ?? defaults.Position : defaults.Position,
                widget.TryGetProperty("welcomeMessage", out var welcome) ? welcome.GetString() ?? defaults.WelcomeMessage : defaults.WelcomeMessage,
                widget.TryGetProperty("preChatEnabled", out var preChat) && preChat.ValueKind == JsonValueKind.True);
        }
        catch
        {
            return defaults;
        }
    }

    private sealed record Branding(string PrimaryColor, string Position, string WelcomeMessage, bool PreChatEnabled);
}
