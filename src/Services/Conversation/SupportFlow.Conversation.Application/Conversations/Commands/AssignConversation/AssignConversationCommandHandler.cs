using MediatR;
using SupportFlow.Conversation.Application.Common.Exceptions;
using SupportFlow.Conversation.Application.Common.Interfaces;
using SupportFlow.Shared.Contracts.Conversations;

namespace SupportFlow.Conversation.Application.Conversations.Commands.AssignConversation;

public sealed class AssignConversationCommandHandler : IRequestHandler<AssignConversationCommand, ConversationDto>
{
    private readonly ICurrentUserService _currentUser;
    private readonly IConversationService _conversationService;

    public AssignConversationCommandHandler(
        ICurrentUserService currentUser,
        IConversationService conversationService)
    {
        _currentUser = currentUser;
        _conversationService = conversationService;
    }

    public Task<ConversationDto> Handle(AssignConversationCommand request, CancellationToken cancellationToken)
    {
        if (_currentUser.TenantId is null || _currentUser.UserId is null)
        {
            throw new UnauthorizedException("Authentication is required.");
        }

        var assigneeId = request.AssigneeId ?? _currentUser.UserId.Value;
        return _conversationService.AssignAsync(
            _currentUser.TenantId.Value,
            request.ConversationId,
            assigneeId,
            _currentUser.UserId,
            cancellationToken);
    }
}
