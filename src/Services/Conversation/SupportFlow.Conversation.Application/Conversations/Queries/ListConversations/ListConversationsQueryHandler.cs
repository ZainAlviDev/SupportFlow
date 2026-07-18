using MediatR;
using SupportFlow.Conversation.Application.Common.Exceptions;
using SupportFlow.Conversation.Application.Common.Interfaces;

namespace SupportFlow.Conversation.Application.Conversations.Queries.ListConversations;

public sealed class ListConversationsQueryHandler : IRequestHandler<ListConversationsQuery, ConversationListResult>
{
    private readonly ICurrentUserService _currentUser;
    private readonly IConversationService _conversationService;

    public ListConversationsQueryHandler(
        ICurrentUserService currentUser,
        IConversationService conversationService)
    {
        _currentUser = currentUser;
        _conversationService = conversationService;
    }

    public Task<ConversationListResult> Handle(ListConversationsQuery request, CancellationToken cancellationToken)
    {
        if (_currentUser.TenantId is null)
        {
            throw new UnauthorizedException("Tenant context is required.");
        }

        return _conversationService.ListAsync(
            _currentUser.TenantId.Value,
            request.Status,
            request.Assignee,
            _currentUser.UserId,
            request.CustomerId,
            request.Page,
            request.PageSize,
            cancellationToken);
    }
}
