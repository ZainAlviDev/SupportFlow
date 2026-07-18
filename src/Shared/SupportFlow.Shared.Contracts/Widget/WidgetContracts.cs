using SupportFlow.Shared.Contracts.Conversations;

namespace SupportFlow.Shared.Contracts.Widget;

public sealed record WidgetConfigDto(
    string WorkspaceName,
    string PrimaryColor,
    string Position,
    string WelcomeMessage,
    bool PreChatEnabled);

public sealed record StartWidgetConversationRequest(
    string VisitorId,
    string? Name = null,
    string? Email = null,
    string? InitialMessage = null);

public sealed record WidgetConversationDto(
    Guid Id,
    Guid CustomerId,
    string Status,
    DateTime LastMessageAt,
    DateTime CreatedAt);

public sealed record SendWidgetMessageRequest(string Body, string VisitorId);

public sealed record WidgetMessageDto(
    Guid Id,
    Guid ConversationId,
    string SenderType,
    string Body,
    DateTime CreatedAt);
