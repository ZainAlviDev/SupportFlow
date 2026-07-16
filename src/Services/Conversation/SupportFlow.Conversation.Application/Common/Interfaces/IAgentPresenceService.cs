namespace SupportFlow.Conversation.Application.Common.Interfaces;

public interface IAgentPresenceService
{
    Task SetOnlineAsync(Guid tenantId, Guid userId, string? displayName, CancellationToken cancellationToken);

    Task SetOfflineAsync(Guid tenantId, Guid userId, CancellationToken cancellationToken);

    Task<IReadOnlyList<(Guid UserId, string? DisplayName)>> GetOnlineAgentsAsync(
        Guid tenantId,
        CancellationToken cancellationToken);
}
