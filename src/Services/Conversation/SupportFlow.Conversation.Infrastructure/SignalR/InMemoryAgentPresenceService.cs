using System.Collections.Concurrent;
using SupportFlow.Conversation.Application.Common.Interfaces;

namespace SupportFlow.Conversation.Infrastructure.SignalR;

/// <summary>Local-dev fallback when Redis is unavailable (single-instance only).</summary>
public sealed class InMemoryAgentPresenceService : IAgentPresenceService
{
    private readonly ConcurrentDictionary<Guid, ConcurrentDictionary<Guid, string?>> _byTenant = new();

    public Task SetOnlineAsync(
        Guid tenantId,
        Guid userId,
        string? displayName,
        CancellationToken cancellationToken)
    {
        var agents = _byTenant.GetOrAdd(tenantId, _ => new ConcurrentDictionary<Guid, string?>());
        agents[userId] = displayName;
        return Task.CompletedTask;
    }

    public Task SetOfflineAsync(Guid tenantId, Guid userId, CancellationToken cancellationToken)
    {
        if (_byTenant.TryGetValue(tenantId, out var agents))
        {
            agents.TryRemove(userId, out _);
        }

        return Task.CompletedTask;
    }

    public Task<IReadOnlyList<(Guid UserId, string? DisplayName)>> GetOnlineAgentsAsync(
        Guid tenantId,
        CancellationToken cancellationToken)
    {
        if (!_byTenant.TryGetValue(tenantId, out var agents))
        {
            return Task.FromResult<IReadOnlyList<(Guid, string?)>>(Array.Empty<(Guid, string?)>());
        }

        IReadOnlyList<(Guid, string?)> list = agents
            .Select(pair => (pair.Key, pair.Value))
            .ToList();

        return Task.FromResult(list);
    }
}
