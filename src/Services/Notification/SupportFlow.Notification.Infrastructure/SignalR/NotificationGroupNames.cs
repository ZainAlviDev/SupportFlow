namespace SupportFlow.Notification.Infrastructure.SignalR;

public static class NotificationGroupNames
{
    public static string User(Guid tenantId, Guid userId) => $"tenant:{tenantId}:user:{userId}";
}
