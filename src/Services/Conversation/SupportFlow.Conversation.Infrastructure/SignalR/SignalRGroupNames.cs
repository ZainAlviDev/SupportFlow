namespace SupportFlow.Conversation.Infrastructure.SignalR;

public static class SignalRGroupNames
{
    public static string Agents(Guid tenantId) => $"tenant:{tenantId}:agents";

    public static string Conversation(Guid tenantId, Guid conversationId) =>
        $"tenant:{tenantId}:conversation:{conversationId}";

    public static string User(Guid tenantId, Guid userId) => $"tenant:{tenantId}:user:{userId}";
}
