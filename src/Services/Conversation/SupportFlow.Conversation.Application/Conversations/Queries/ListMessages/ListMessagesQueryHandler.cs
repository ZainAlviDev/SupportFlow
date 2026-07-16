using MediatR;
using SupportFlow.Conversation.Application.Common.Exceptions;
using SupportFlow.Conversation.Application.Common.Interfaces;

namespace SupportFlow.Conversation.Application.Conversations.Queries.ListMessages;

public sealed class ListMessagesQueryHandler : IRequestHandler<ListMessagesQuery, MessageListResult>
{
    private readonly ICurrentUserService _currentUser;
    private readonly IConversationService _conversationService;

    public ListMessagesQueryHandler(
        ICurrentUserService currentUser,
        IConversationService conversationService)
    {
        _currentUser = currentUser;
        _conversationService = conversationService;
    }

    public Task<MessageListResult> Handle(ListMessagesQuery request, CancellationToken cancellationToken)
    {
        if (_currentUser.TenantId is null)
        {
            throw new UnauthorizedException("Tenant context is required.");
        }

        return _conversationService.ListMessagesAsync(
            _currentUser.TenantId.Value,
            request.ConversationId,
            request.Page,
            request.PageSize,
            cancellationToken);
    }
}
