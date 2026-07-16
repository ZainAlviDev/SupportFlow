using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using SupportFlow.Conversation.Application.Common.Interfaces;
using SupportFlow.Conversation.Infrastructure.SignalR;
using SupportFlow.Shared.Contracts.Realtime;

namespace SupportFlow.Conversation.Infrastructure.Hubs;

[Authorize]
public sealed class PresenceHub : Hub
{
    private readonly IAgentPresenceService _presenceService;

    public PresenceHub(IAgentPresenceService presenceService)
    {
        _presenceService = presenceService;
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

    private Guid RequireUserId()
    {
        var value = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? Context.User?.FindFirstValue("sub");
        if (!Guid.TryParse(value, out var userId) || userId == Guid.Empty)
        {
            throw new HubException("User context is required.");
        }

        return userId;
    }

    private string? DisplayName() =>
        Context.User?.FindFirstValue("name")
        ?? Context.User?.FindFirstValue(ClaimTypes.Email)
        ?? Context.User?.FindFirstValue("email");

    public override async Task OnConnectedAsync()
    {
        var tenantId = RequireTenantId();
        var userId = RequireUserId();

        await Groups.AddToGroupAsync(Context.ConnectionId, SignalRGroupNames.Agents(tenantId));
        await Groups.AddToGroupAsync(Context.ConnectionId, SignalRGroupNames.User(tenantId, userId));
        await base.OnConnectedAsync();
    }

    public async Task SetOnline()
    {
        var tenantId = RequireTenantId();
        var userId = RequireUserId();
        var displayName = DisplayName();

        await _presenceService.SetOnlineAsync(tenantId, userId, displayName, Context.ConnectionAborted);

        await Clients
            .Group(SignalRGroupNames.Agents(tenantId))
            .SendAsync(
                HubEventNames.AgentPresenceChanged,
                new AgentPresenceChangedDto(userId, displayName, IsOnline: true));
    }

    public async Task SetOffline()
    {
        var tenantId = RequireTenantId();
        var userId = RequireUserId();
        var displayName = DisplayName();

        await _presenceService.SetOfflineAsync(tenantId, userId, Context.ConnectionAborted);

        await Clients
            .Group(SignalRGroupNames.Agents(tenantId))
            .SendAsync(
                HubEventNames.AgentPresenceChanged,
                new AgentPresenceChangedDto(userId, displayName, IsOnline: false));
    }

    public async Task<IReadOnlyList<OnlineAgentDto>> GetOnlineAgents()
    {
        var tenantId = RequireTenantId();
        var agents = await _presenceService.GetOnlineAgentsAsync(tenantId, Context.ConnectionAborted);
        return agents
            .Select(a => new OnlineAgentDto(a.UserId, a.DisplayName))
            .ToList();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        try
        {
            var tenantId = RequireTenantId();
            var userId = RequireUserId();
            var displayName = DisplayName();

            await _presenceService.SetOfflineAsync(tenantId, userId, CancellationToken.None);
            await Clients
                .Group(SignalRGroupNames.Agents(tenantId))
                .SendAsync(
                    HubEventNames.AgentPresenceChanged,
                    new AgentPresenceChangedDto(userId, displayName, IsOnline: false));
        }
        catch (HubException)
        {
            // Connection may disconnect before JWT claims are available.
        }

        await base.OnDisconnectedAsync(exception);
    }
}
