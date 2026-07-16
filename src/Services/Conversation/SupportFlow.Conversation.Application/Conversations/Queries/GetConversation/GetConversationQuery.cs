using MediatR;
using SupportFlow.Shared.Contracts.Conversations;

namespace SupportFlow.Conversation.Application.Conversations.Queries.GetConversation;

public sealed record GetConversationQuery(Guid ConversationId) : IRequest<ConversationDto>;
