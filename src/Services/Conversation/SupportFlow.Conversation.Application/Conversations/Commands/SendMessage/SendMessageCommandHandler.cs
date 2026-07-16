using MediatR;
using SupportFlow.Conversation.Application.Common.Exceptions;
using SupportFlow.Conversation.Application.Common.Interfaces;
using SupportFlow.Shared.Contracts.Conversations;

namespace SupportFlow.Conversation.Application.Conversations.Commands.SendMessage;

public sealed class SendMessageCommandHandler : IRequestHandler<SendMessageCommand, MessageDto>
{
    private readonly ICurrentUserService _currentUser;
    private readonly IConversationService _conversationService;

    public SendMessageCommandHandler(
        ICurrentUserService currentUser,
        IConversationService conversationService)
    {
        _currentUser = currentUser;
        _conversationService = conversationService;
    }

    public Task<MessageDto> Handle(SendMessageCommand request, CancellationToken cancellationToken)
    {
        if (_currentUser.TenantId is null)
        {
            throw new UnauthorizedException("Tenant context is required.");
        }

        return _conversationService.SendMessageAsync(
            _currentUser.TenantId.Value,
            request.ConversationId,
            _currentUser.UserId,
            request.Body,
            request.IsAiGenerated,
            cancellationToken);
    }
}
