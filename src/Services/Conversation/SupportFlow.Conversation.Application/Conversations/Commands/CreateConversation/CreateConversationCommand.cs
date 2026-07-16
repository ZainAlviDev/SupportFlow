using MediatR;
using SupportFlow.Shared.Contracts.Conversations;

namespace SupportFlow.Conversation.Application.Conversations.Commands.CreateConversation;

public sealed record CreateConversationCommand(
    Guid CustomerId,
    string? Channel,
    Guid? AssigneeId,
    IReadOnlyList<string>? Tags,
    string? InitialMessage) : IRequest<ConversationDto>;
