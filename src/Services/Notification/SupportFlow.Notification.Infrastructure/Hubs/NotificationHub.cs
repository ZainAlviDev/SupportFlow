using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using SupportFlow.Notification.Infrastructure.SignalR;

namespace SupportFlow.Notification.Infrastructure.Hubs;

[Authorize]
public sealed class NotificationHub : Hub
{
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

    public override async Task OnConnectedAsync()
    {
        var tenantId = RequireTenantId();
        var userId = RequireUserId();
        await Groups.AddToGroupAsync(Context.ConnectionId, NotificationGroupNames.User(tenantId, userId));
        await base.OnConnectedAsync();
    }
}
