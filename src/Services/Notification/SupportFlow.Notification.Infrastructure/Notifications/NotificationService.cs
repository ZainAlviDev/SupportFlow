using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using SupportFlow.Notification.Application.Common.Exceptions;
using SupportFlow.Notification.Application.Common.Interfaces;
using SupportFlow.Notification.Domain.Entities;
using SupportFlow.Notification.Domain.Enums;
using SupportFlow.Notification.Infrastructure.Hubs;
using SupportFlow.Notification.Infrastructure.Persistence;
using SupportFlow.Notification.Infrastructure.SignalR;
using SupportFlow.Shared.Contracts.Notifications;
using SupportFlow.Shared.Contracts.Realtime;

namespace SupportFlow.Notification.Infrastructure.Notifications;

public sealed class NotificationService : INotificationService
{
    private readonly NotificationDbContext _dbContext;
    private readonly IHubContext<NotificationHub> _hubContext;

    public NotificationService(NotificationDbContext dbContext, IHubContext<NotificationHub> hubContext)
    {
        _dbContext = dbContext;
        _hubContext = hubContext;
    }

    public async Task<NotificationListResult> ListAsync(
        Guid tenantId,
        Guid userId,
        int page,
        int pageSize,
        bool? unreadOnly,
        CancellationToken cancellationToken = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = _dbContext.Notifications
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Where(x => x.TenantId == tenantId && x.UserId == userId);

        if (unreadOnly == true)
        {
            query = query.Where(x => !x.IsRead);
        }

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(x => x.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return new NotificationListResult(items.Select(Map).ToList(), page, pageSize, totalCount);
    }

    public async Task<UnreadCountDto> GetUnreadCountAsync(
        Guid tenantId,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var count = await _dbContext.Notifications
            .IgnoreQueryFilters()
            .AsNoTracking()
            .CountAsync(x => x.TenantId == tenantId && x.UserId == userId && !x.IsRead, cancellationToken);

        return new UnreadCountDto(count);
    }

    public async Task<NotificationDto> MarkAsReadAsync(
        Guid tenantId,
        Guid userId,
        Guid notificationId,
        CancellationToken cancellationToken = default)
    {
        var notification = await _dbContext.Notifications
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(
                x => x.Id == notificationId && x.TenantId == tenantId && x.UserId == userId,
                cancellationToken);

        if (notification is null)
        {
            throw new NotFoundException("Notification was not found.");
        }

        notification.MarkAsRead();
        await _dbContext.SaveChangesAsync(cancellationToken);
        return Map(notification);
    }

    public async Task<int> MarkAllAsReadAsync(
        Guid tenantId,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var unread = await _dbContext.Notifications
            .IgnoreQueryFilters()
            .Where(x => x.TenantId == tenantId && x.UserId == userId && !x.IsRead)
            .ToListAsync(cancellationToken);

        foreach (var notification in unread)
        {
            notification.MarkAsRead();
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
        return unread.Count;
    }

    public async Task<NotificationDto> CreateAsync(
        Guid tenantId,
        CreateNotificationRequest request,
        CancellationToken cancellationToken = default)
    {
        if (request.UserId == Guid.Empty)
        {
            throw new ArgumentException("User id is required.", nameof(request));
        }

        if (!string.IsNullOrWhiteSpace(request.IdempotencyKey))
        {
            var key = request.IdempotencyKey.Trim();
            var existing = await _dbContext.Notifications
                .IgnoreQueryFilters()
                .AsNoTracking()
                .FirstOrDefaultAsync(
                    x => x.TenantId == tenantId && x.IdempotencyKey == key,
                    cancellationToken);

            if (existing is not null)
            {
                return Map(existing);
            }
        }

        if (!Enum.TryParse<NotificationType>(request.Type, ignoreCase: true, out var type))
        {
            throw new ArgumentException($"Unknown notification type '{request.Type}'.", nameof(request));
        }

        var notification = new AppNotification(
            tenantId,
            request.UserId,
            type,
            request.Title,
            request.Body,
            request.ResourceType,
            request.ResourceId,
            request.IdempotencyKey);

        _dbContext.Notifications.Add(notification);

        try
        {
            await _dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException) when (!string.IsNullOrWhiteSpace(request.IdempotencyKey))
        {
            _dbContext.Entry(notification).State = EntityState.Detached;

            var existing = await _dbContext.Notifications
                .IgnoreQueryFilters()
                .AsNoTracking()
                .FirstOrDefaultAsync(
                    x => x.TenantId == tenantId && x.IdempotencyKey == request.IdempotencyKey.Trim(),
                    cancellationToken);

            if (existing is not null)
            {
                return Map(existing);
            }

            throw;
        }

        var dto = Map(notification);
        await _hubContext.Clients
            .Group(NotificationGroupNames.User(tenantId, notification.UserId))
            .SendAsync(HubEventNames.NotificationReceived, dto, cancellationToken);

        return dto;
    }

    private static NotificationDto Map(AppNotification notification) =>
        new(
            notification.Id,
            notification.TenantId,
            notification.UserId,
            notification.Type.ToString(),
            notification.Title,
            notification.Body,
            notification.ResourceType,
            notification.ResourceId,
            notification.IsRead,
            notification.ReadAt,
            notification.CreatedAt);
}
