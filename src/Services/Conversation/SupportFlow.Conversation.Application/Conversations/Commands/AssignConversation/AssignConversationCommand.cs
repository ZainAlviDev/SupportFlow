using MediatR;
using SupportFlow.Shared.Contracts.Conversations;

namespace SupportFlow.Conversation.Application.Conversations.Commands.AssignConversation;

public sealed record AssignConversationCommand(Guid ConversationId, Guid? AssigneeId) : IRequest<ConversationDto>;
