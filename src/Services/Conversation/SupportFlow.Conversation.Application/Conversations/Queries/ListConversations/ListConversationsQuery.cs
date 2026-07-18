using MediatR;
using SupportFlow.Conversation.Application.Common.Interfaces;

namespace SupportFlow.Conversation.Application.Conversations.Queries.ListConversations;

public sealed record ListConversationsQuery(
    string? Status,
    string? Assignee,
    Guid? CustomerId,
    int Page,
    int PageSize) : IRequest<ConversationListResult>;
