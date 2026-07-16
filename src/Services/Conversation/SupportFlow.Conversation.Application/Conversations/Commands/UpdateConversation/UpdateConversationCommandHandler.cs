using MediatR;
using SupportFlow.Conversation.Application.Common.Exceptions;
using SupportFlow.Conversation.Application.Common.Interfaces;
using SupportFlow.Shared.Contracts.Conversations;

namespace SupportFlow.Conversation.Application.Conversations.Commands.UpdateConversation;

public sealed class UpdateConversationCommandHandler : IRequestHandler<UpdateConversationCommand, ConversationDto>
{
    private readonly ICurrentUserService _currentUser;
    private readonly IConversationService _conversationService;

    public UpdateConversationCommandHandler(
        ICurrentUserService currentUser,
        IConversationService conversationService)
    {
        _currentUser = currentUser;
        _conversationService = conversationService;
    }

    public Task<ConversationDto> Handle(UpdateConversationCommand request, CancellationToken cancellationToken)
    {
        if (_currentUser.TenantId is null)
        {
            throw new UnauthorizedException("Tenant context is required.");
        }

        return _conversationService.UpdateAsync(
            _currentUser.TenantId.Value,
            request.ConversationId,
            request.Status,
            request.AssigneeId,
            request.ClearAssignee,
            request.SnoozedUntil,
            request.ClearSnooze,
            request.Tags,
            cancellationToken);
    }
}
