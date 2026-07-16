namespace SupportFlow.Shared.Contracts.Conversations;

public sealed record CreateConversationRequest(
    Guid CustomerId,
    string? Channel = null,
    Guid? AssigneeId = null,
    IReadOnlyList<string>? Tags = null,
    string? InitialMessage = null);

public sealed record UpdateConversationRequest(
    string? Status = null,
    Guid? AssigneeId = null,
    bool ClearAssignee = false,
    DateTime? SnoozedUntil = null,
    bool ClearSnooze = false,
    IReadOnlyList<string>? Tags = null);

public sealed record SendMessageRequest(string Body, bool IsAiGenerated = false);

/// <summary>Assign to a specific agent, or omit assigneeId to claim for the current user.</summary>
public sealed record AssignConversationRequest(Guid? AssigneeId = null);

public sealed record ChangeConversationStatusRequest(string Status, DateTime? SnoozedUntil = null);

public sealed record ConversationDto(
    Guid Id,
    Guid TenantId,
    Guid CustomerId,
    string Status,
    Guid? AssigneeId,
    string Channel,
    DateTime? SnoozedUntil,
    DateTime LastMessageAt,
    IReadOnlyList<string> Tags,
    DateTime CreatedAt,
    DateTime? UpdatedAt);

public sealed record MessageDto(
    Guid Id,
    Guid ConversationId,
    Guid TenantId,
    string SenderType,
    Guid? SenderId,
    string Body,
    bool IsAiGenerated,
    DateTime CreatedAt);
