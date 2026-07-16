using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using SupportFlow.Conversation.Application.Common.Interfaces;
using SupportFlow.Conversation.Infrastructure.SignalR;
using SupportFlow.Shared.Contracts.Realtime;

namespace SupportFlow.Conversation.Infrastructure.Hubs;

[Authorize]
public sealed class ConversationHub : Hub
{
    private readonly IConversationService _conversationService;

    public ConversationHub(IConversationService conversationService)
    {
        _conversationService = conversationService;
    }

    private Guid RequireTenantId()
    {
        var value = Context.User?.FindFirstValue("tenant_id");
        if (!Guid.TryParse(value, out var tenantId) || tenantId == Guid.Empty)
        {
            throw new HubException("Tenant context is required.");
        }

        return tenantId;
    }

    private Guid? TryUserId()
    {
        var value = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? Context.User?.FindFirstValue("sub");
        return Guid.TryParse(value, out var userId) ? userId : null;
    }

    private string SenderDisplayName() =>
        Context.User?.FindFirstValue("name")
        ?? Context.User?.FindFirstValue(ClaimTypes.Email)
        ?? Context.User?.FindFirstValue("email")
        ?? "Agent";

    public async Task JoinConversation(Guid conversationId)
    {
        if (conversationId == Guid.Empty)
        {
            throw new HubException("Conversation id is required.");
        }

        var tenantId = RequireTenantId();
        await Groups.AddToGroupAsync(
            Context.ConnectionId,
            SignalRGroupNames.Conversation(tenantId, conversationId));
    }

    public async Task LeaveConversation(Guid conversationId)
    {
        if (conversationId == Guid.Empty)
        {
            throw new HubException("Conversation id is required.");
        }

        var tenantId = RequireTenantId();
        await Groups.RemoveFromGroupAsync(
            Context.ConnectionId,
            SignalRGroupNames.Conversation(tenantId, conversationId));
    }

    public async Task SendMessage(Guid conversationId, string body)
    {
        if (conversationId == Guid.Empty)
        {
            throw new HubException("Conversation id is required.");
        }

        if (string.IsNullOrWhiteSpace(body))
        {
            throw new HubException("Message body is required.");
        }

        var tenantId = RequireTenantId();
        await _conversationService.SendMessageAsync(
            tenantId,
            conversationId,
            TryUserId(),
            body,
            isAiGenerated: false,
            Context.ConnectionAborted);
    }

    public async Task SendTyping(Guid conversationId)
    {
        if (conversationId == Guid.Empty)
        {
            throw new HubException("Conversation id is required.");
        }

        var tenantId = RequireTenantId();
        var payload = new TypingStartedDto(conversationId, SenderDisplayName(), TryUserId());

        await Clients
            .OthersInGroup(SignalRGroupNames.Conversation(tenantId, conversationId))
            .SendAsync(HubEventNames.TypingStarted, payload);
    }

    public async Task StopTyping(Guid conversationId)
    {
        if (conversationId == Guid.Empty)
        {
            throw new HubException("Conversation id is required.");
        }

        var tenantId = RequireTenantId();
        var payload = new TypingStoppedDto(conversationId, TryUserId());

        await Clients
            .OthersInGroup(SignalRGroupNames.Conversation(tenantId, conversationId))
            .SendAsync(HubEventNames.TypingStopped, payload);
    }
}
