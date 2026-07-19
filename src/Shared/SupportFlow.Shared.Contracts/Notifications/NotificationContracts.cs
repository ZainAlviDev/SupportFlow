namespace SupportFlow.Shared.Contracts.Notifications;

public sealed record NotificationDto(
    Guid Id,
    Guid TenantId,
    Guid UserId,
    string Type,
    string Title,
    string Body,
    string? ResourceType,
    Guid? ResourceId,
    bool IsRead,
    DateTime? ReadAt,
    DateTime CreatedAt);

public sealed record UnreadCountDto(int Count);

public sealed record CreateNotificationRequest(
    Guid UserId,
    string Type,
    string Title,
    string Body,
    string? ResourceType = null,
    Guid? ResourceId = null,
    string? IdempotencyKey = null);

public sealed record MarkNotificationsReadRequest(IReadOnlyList<Guid>? Ids = null);
