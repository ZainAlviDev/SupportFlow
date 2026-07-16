using MediatR;
using SupportFlow.Shared.Contracts.Conversations;

namespace SupportFlow.Conversation.Application.Conversations.Commands.ChangeConversationStatus;

public sealed record ChangeConversationStatusCommand(
    Guid ConversationId,
    string Status,
    DateTime? SnoozedUntil) : IRequest<ConversationDto>;
