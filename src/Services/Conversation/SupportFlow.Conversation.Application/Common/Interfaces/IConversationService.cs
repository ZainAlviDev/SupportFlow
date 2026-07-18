using SupportFlow.Shared.Contracts.Conversations;

namespace SupportFlow.Conversation.Application.Common.Interfaces;

public sealed record ConversationListResult(
    IReadOnlyList<ConversationDto> Items,
    int Page,
    int PageSize,
    int TotalCount);

public sealed record MessageListResult(
    IReadOnlyList<MessageDto> Items,
    int Page,
    int PageSize,
    int TotalCount);

public interface IConversationService
{
    Task<ConversationListResult> ListAsync(
        Guid tenantId,
        string? status,
        string? assignee,
        Guid? currentUserId,
        Guid? customerId,
        int page,
        int pageSize,
        CancellationToken cancellationToken);

    Task<ConversationDto> GetByIdAsync(Guid tenantId, Guid conversationId, CancellationToken cancellationToken);

    Task<ConversationDto> CreateAsync(
        Guid tenantId,
        Guid? actorUserId,
        Guid customerId,
        string? channel,
        Guid? assigneeId,
        IReadOnlyList<string>? tags,
        string? initialMessage,
        CancellationToken cancellationToken);

    Task<ConversationDto> UpdateAsync(
        Guid tenantId,
        Guid conversationId,
        string? status,
        Guid? assigneeId,
        bool clearAssignee,
        DateTime? snoozedUntil,
        bool clearSnooze,
        IReadOnlyList<string>? tags,
        CancellationToken cancellationToken);

    Task<ConversationDto> AssignAsync(
        Guid tenantId,
        Guid conversationId,
        Guid assigneeId,
        Guid? actorUserId,
        CancellationToken cancellationToken);

    Task<ConversationDto> UnassignAsync(
        Guid tenantId,
        Guid conversationId,
        Guid? actorUserId,
        CancellationToken cancellationToken);

    Task<ConversationDto> ChangeStatusAsync(
        Guid tenantId,
        Guid conversationId,
        string status,
        DateTime? snoozedUntil,
        Guid? actorUserId,
        CancellationToken cancellationToken);

    Task<MessageListResult> ListMessagesAsync(
        Guid tenantId,
        Guid conversationId,
        int page,
        int pageSize,
        CancellationToken cancellationToken);

    Task<MessageDto> SendMessageAsync(
        Guid tenantId,
        Guid conversationId,
        Guid? senderId,
        string body,
        bool isAiGenerated,
        CancellationToken cancellationToken);

    Task<MessageDto> SendMessageAsync(
        Guid tenantId,
        Guid conversationId,
        Guid? senderId,
        string body,
        string senderType,
        bool isAiGenerated,
        CancellationToken cancellationToken);

    Task<ConversationDto?> FindOpenByCustomerAsync(
        Guid tenantId,
        Guid customerId,
        CancellationToken cancellationToken);
}
