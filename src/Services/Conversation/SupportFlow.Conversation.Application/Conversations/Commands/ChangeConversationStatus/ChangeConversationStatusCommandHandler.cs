using MediatR;
using SupportFlow.Conversation.Application.Common.Exceptions;
using SupportFlow.Conversation.Application.Common.Interfaces;
using SupportFlow.Shared.Contracts.Conversations;

namespace SupportFlow.Conversation.Application.Conversations.Commands.ChangeConversationStatus;

public sealed class ChangeConversationStatusCommandHandler
    : IRequestHandler<ChangeConversationStatusCommand, ConversationDto>
{
    private readonly ICurrentUserService _currentUser;
    private readonly IConversationService _conversationService;

    public ChangeConversationStatusCommandHandler(
        ICurrentUserService currentUser,
        IConversationService conversationService)
    {
        _currentUser = currentUser;
        _conversationService = conversationService;
    }

    public Task<ConversationDto> Handle(
        ChangeConversationStatusCommand request,
        CancellationToken cancellationToken)
    {
        if (_currentUser.TenantId is null)
        {
            throw new UnauthorizedException("Tenant context is required.");
        }

        return _conversationService.ChangeStatusAsync(
            _currentUser.TenantId.Value,
            request.ConversationId,
            request.Status,
            request.SnoozedUntil,
            _currentUser.UserId,
            cancellationToken);
    }
}
