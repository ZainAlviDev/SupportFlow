using SupportFlow.Shared.Contracts.Notifications;

namespace SupportFlow.Notification.Application.Common.Interfaces;

public sealed record NotificationListResult(
    IReadOnlyList<NotificationDto> Items,
    int Page,
    int PageSize,
    int TotalCount);

public interface INotificationService
{
    Task<NotificationListResult> ListAsync(
        Guid tenantId,
        Guid userId,
        int page,
        int pageSize,
        bool? unreadOnly,
        CancellationToken cancellationToken = default);

    Task<UnreadCountDto> GetUnreadCountAsync(
        Guid tenantId,
        Guid userId,
        CancellationToken cancellationToken = default);

    Task<NotificationDto> MarkAsReadAsync(
        Guid tenantId,
        Guid userId,
        Guid notificationId,
        CancellationToken cancellationToken = default);

    Task<int> MarkAllAsReadAsync(
        Guid tenantId,
        Guid userId,
        CancellationToken cancellationToken = default);

    Task<NotificationDto> CreateAsync(
        Guid tenantId,
        CreateNotificationRequest request,
        CancellationToken cancellationToken = default);
}
