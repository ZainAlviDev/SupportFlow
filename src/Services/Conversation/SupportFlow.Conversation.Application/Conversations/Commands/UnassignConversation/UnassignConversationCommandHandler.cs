using MediatR;
using SupportFlow.Conversation.Application.Common.Exceptions;
using SupportFlow.Conversation.Application.Common.Interfaces;
using SupportFlow.Shared.Contracts.Conversations;

namespace SupportFlow.Conversation.Application.Conversations.Commands.UnassignConversation;

public sealed class UnassignConversationCommandHandler : IRequestHandler<UnassignConversationCommand, ConversationDto>
{
    private readonly ICurrentUserService _currentUser;
    private readonly IConversationService _conversationService;

    public UnassignConversationCommandHandler(
        ICurrentUserService currentUser,
        IConversationService conversationService)
    {
        _currentUser = currentUser;
        _conversationService = conversationService;
    }

    public Task<ConversationDto> Handle(UnassignConversationCommand request, CancellationToken cancellationToken)
    {
        if (_currentUser.TenantId is null)
        {
            throw new UnauthorizedException("Tenant context is required.");
        }

        return _conversationService.UnassignAsync(
            _currentUser.TenantId.Value,
            request.ConversationId,
            _currentUser.UserId,
            cancellationToken);
    }
}
