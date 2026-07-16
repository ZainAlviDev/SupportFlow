using MediatR;
using Microsoft.AspNetCore.SignalR;
using SupportFlow.Conversation.Application.Common.Events;
using SupportFlow.Conversation.Infrastructure.Hubs;
using SupportFlow.Shared.Contracts.Realtime;

namespace SupportFlow.Conversation.Infrastructure.SignalR;

public sealed class ConversationUpdatedNotificationHandler : INotificationHandler<ConversationUpdatedNotification>
{
    private readonly IHubContext<ConversationHub> _hubContext;

    public ConversationUpdatedNotificationHandler(IHubContext<ConversationHub> hubContext)
    {
        _hubContext = hubContext;
    }

    public async Task Handle(ConversationUpdatedNotification notification, CancellationToken cancellationToken)
    {
        var conversation = notification.Conversation;

        await _hubContext.Clients
            .Group(SignalRGroupNames.Agents(conversation.TenantId))
            .SendAsync(HubEventNames.ConversationUpdated, conversation, cancellationToken);

        await _hubContext.Clients
            .Group(SignalRGroupNames.Conversation(conversation.TenantId, conversation.Id))
            .SendAsync(HubEventNames.ConversationUpdated, conversation, cancellationToken);
    }
}
