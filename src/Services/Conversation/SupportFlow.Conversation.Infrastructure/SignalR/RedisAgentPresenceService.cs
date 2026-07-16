using SupportFlow.Conversation.Application.Common.Interfaces;
using StackExchange.Redis;

namespace SupportFlow.Conversation.Infrastructure.SignalR;

public sealed class RedisAgentPresenceService : IAgentPresenceService
{
    private readonly IConnectionMultiplexer _redis;

    public RedisAgentPresenceService(IConnectionMultiplexer redis)
    {
        _redis = redis;
    }

    public async Task SetOnlineAsync(
        Guid tenantId,
        Guid userId,
        string? displayName,
        CancellationToken cancellationToken)
    {
        var db = _redis.GetDatabase();
        var key = Key(tenantId);
        await db.HashSetAsync(key, userId.ToString(), displayName ?? string.Empty);
        await db.KeyExpireAsync(key, TimeSpan.FromHours(12));
    }

    public async Task SetOfflineAsync(Guid tenantId, Guid userId, CancellationToken cancellationToken)
    {
        var db = _redis.GetDatabase();
        await db.HashDeleteAsync(Key(tenantId), userId.ToString());
    }

    public async Task<IReadOnlyList<(Guid UserId, string? DisplayName)>> GetOnlineAgentsAsync(
        Guid tenantId,
        CancellationToken cancellationToken)
    {
        var db = _redis.GetDatabase();
        var entries = await db.HashGetAllAsync(Key(tenantId));
        var result = new List<(Guid, string?)>(entries.Length);

        foreach (var entry in entries)
        {
            if (!Guid.TryParse(entry.Name, out var userId))
            {
                continue;
            }

            var name = entry.Value.HasValue ? entry.Value.ToString() : null;
            result.Add((userId, string.IsNullOrWhiteSpace(name) ? null : name));
        }

        return result;
    }

    private static string Key(Guid tenantId) => $"sf:presence:tenant:{tenantId}";
}
