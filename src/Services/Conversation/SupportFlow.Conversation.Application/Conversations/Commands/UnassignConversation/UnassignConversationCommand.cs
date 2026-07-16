using MediatR;
using SupportFlow.Shared.Contracts.Conversations;

namespace SupportFlow.Conversation.Application.Conversations.Commands.UnassignConversation;

public sealed record UnassignConversationCommand(Guid ConversationId) : IRequest<ConversationDto>;
