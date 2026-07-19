using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SupportFlow.Notification.Application.Common.Exceptions;
using SupportFlow.Notification.Application.Common.Interfaces;
using SupportFlow.Shared.Contracts.Common;
using SupportFlow.Shared.Contracts.Notifications;

namespace SupportFlow.Notification.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/notifications")]
public sealed class NotificationsController : ControllerBase
{
    private readonly INotificationService _notificationService;
    private readonly ICurrentUserService _currentUser;

    public NotificationsController(INotificationService notificationService, ICurrentUserService currentUser)
    {
        _notificationService = notificationService;
        _currentUser = currentUser;
    }

    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<NotificationDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> List(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] bool? unreadOnly = null,
        CancellationToken cancellationToken = default)
    {
        var (tenantId, userId) = RequireUser();
        var result = await _notificationService.ListAsync(tenantId, userId, page, pageSize, unreadOnly, cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<NotificationDto>>.Success(
            result.Items,
            new { page = result.Page, pageSize = result.PageSize, totalCount = result.TotalCount }));
    }

    [HttpGet("unread-count")]
    [ProducesResponseType(typeof(ApiResponse<UnreadCountDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> UnreadCount(CancellationToken cancellationToken)
    {
        var (tenantId, userId) = RequireUser();
        var result = await _notificationService.GetUnreadCountAsync(tenantId, userId, cancellationToken);
        return Ok(ApiResponse<UnreadCountDto>.Success(result));
    }

    [HttpPost("{id:guid}/read")]
    [ProducesResponseType(typeof(ApiResponse<NotificationDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> MarkAsRead(Guid id, CancellationToken cancellationToken)
    {
        var (tenantId, userId) = RequireUser();
        var result = await _notificationService.MarkAsReadAsync(tenantId, userId, id, cancellationToken);
        return Ok(ApiResponse<NotificationDto>.Success(result));
    }

    [HttpPost("read-all")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> MarkAllAsRead(CancellationToken cancellationToken)
    {
        var (tenantId, userId) = RequireUser();
        var count = await _notificationService.MarkAllAsReadAsync(tenantId, userId, cancellationToken);
        return Ok(ApiResponse<object>.Success(new { markedCount = count }));
    }

    private (Guid TenantId, Guid UserId) RequireUser()
    {
        if (_currentUser.TenantId is not Guid tenantId || tenantId == Guid.Empty)
        {
            throw new UnauthorizedException("Tenant context is required.");
        }

        if (_currentUser.UserId is not Guid userId || userId == Guid.Empty)
        {
            throw new UnauthorizedException("User context is required.");
        }

        return (tenantId, userId);
    }
}
