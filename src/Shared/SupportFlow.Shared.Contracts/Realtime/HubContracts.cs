namespace SupportFlow.Shared.Contracts.Realtime;

public static class HubEventNames
{
    public const string MessageReceived = "MessageReceived";
    public const string ConversationUpdated = "ConversationUpdated";
    public const string TypingStarted = "TypingStarted";
    public const string TypingStopped = "TypingStopped";
    public const string AgentPresenceChanged = "AgentPresenceChanged";
    public const string NotificationReceived = "NotificationReceived";
}

public sealed record TypingStartedDto(Guid ConversationId, string SenderName, Guid? SenderId);

public sealed record TypingStoppedDto(Guid ConversationId, Guid? SenderId);

public sealed record AgentPresenceChangedDto(Guid UserId, string? DisplayName, bool IsOnline);

public sealed record OnlineAgentDto(Guid UserId, string? DisplayName);

/// <summary>Provisional payload until Message REST + MessageSentEvent persist and reshape DTOs.</summary>
public sealed record HubMessageReceivedDto(
    Guid Id,
    Guid ConversationId,
    Guid TenantId,
    string SenderType,
    Guid? SenderId,
    string Body,
    bool IsAiGenerated,
    DateTime CreatedAt);
