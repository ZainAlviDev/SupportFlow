using MediatR;
using SupportFlow.Shared.Contracts.Conversations;

namespace SupportFlow.Conversation.Application.Conversations.Commands.UpdateConversation;

public sealed record UpdateConversationCommand(
    Guid ConversationId,
    string? Status,
    Guid? AssigneeId,
    bool ClearAssignee,
    DateTime? SnoozedUntil,
    bool ClearSnooze,
    IReadOnlyList<string>? Tags) : IRequest<ConversationDto>;
