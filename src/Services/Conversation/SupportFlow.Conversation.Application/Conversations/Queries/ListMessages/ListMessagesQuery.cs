using MediatR;
using SupportFlow.Conversation.Application.Common.Interfaces;

namespace SupportFlow.Conversation.Application.Conversations.Queries.ListMessages;

public sealed record ListMessagesQuery(
    Guid ConversationId,
    int Page,
    int PageSize) : IRequest<MessageListResult>;
