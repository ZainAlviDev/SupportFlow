using MediatR;
using Microsoft.AspNetCore.SignalR;
using SupportFlow.Conversation.Application.Common.Events;
using SupportFlow.Conversation.Infrastructure.Hubs;
using SupportFlow.Conversation.Infrastructure.SignalR;
using SupportFlow.Shared.Contracts.Realtime;

namespace SupportFlow.Conversation.Infrastructure.SignalR;

public sealed class MessageSentNotificationHandler : INotificationHandler<MessageSentNotification>
{
    private readonly IHubContext<ConversationHub> _hubContext;

    public MessageSentNotificationHandler(IHubContext<ConversationHub> hubContext)
    {
        _hubContext = hubContext;
    }

    public async Task Handle(MessageSentNotification notification, CancellationToken cancellationToken)
    {
        var message = notification.Message;
        var payload = new HubMessageReceivedDto(
            message.Id,
            message.ConversationId,
            message.TenantId,
            message.SenderType,
            message.SenderId,
            message.Body,
            message.IsAiGenerated,
            message.CreatedAt);

        await _hubContext.Clients
            .Group(SignalRGroupNames.Conversation(message.TenantId, message.ConversationId))
            .SendAsync(HubEventNames.MessageReceived, payload, cancellationToken);
    }
}
