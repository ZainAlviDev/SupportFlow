using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SupportFlow.Notification.Application.Common.Interfaces;
using SupportFlow.Shared.Contracts.Common;
using SupportFlow.Shared.Contracts.Notifications;
using SupportFlow.Shared.Kernel.Interfaces;

namespace SupportFlow.Notification.Api.Controllers;

[ApiController]
[AllowAnonymous]
[Route("api/v1/internal/notifications")]
public sealed class InternalNotificationsController : ControllerBase
{
    private readonly INotificationService _notificationService;
    private readonly IConfiguration _configuration;
    private readonly ITenantContext _tenantContext;

    public InternalNotificationsController(
        INotificationService notificationService,
        IConfiguration configuration,
        ITenantContext tenantContext)
    {
        _notificationService = notificationService;
        _configuration = configuration;
        _tenantContext = tenantContext;
    }

    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<NotificationDto>), StatusCodes.Status201Created)]
    public async Task<IActionResult> Create(
        [FromBody] CreateNotificationRequest request,
        CancellationToken cancellationToken)
    {
        var expected = _configuration["Internal:ServiceKey"];
        if (!string.IsNullOrWhiteSpace(expected))
        {
            var provided = Request.Headers["X-Internal-Key"].FirstOrDefault();
            if (!string.Equals(provided, expected, StringComparison.Ordinal))
            {
                return Unauthorized(new ApiErrorResponse(new ApiErrorBody("UNAUTHORIZED", "Invalid internal service key.")));
            }
        }

        if (!Guid.TryParse(Request.Headers["X-Tenant-Id"].FirstOrDefault(), out var tenantId) || tenantId == Guid.Empty)
        {
            return BadRequest(new ApiErrorResponse(new ApiErrorBody("VALIDATION_ERROR", "X-Tenant-Id header is required.")));
        }

        _tenantContext.SetTenant(tenantId);
        var result = await _notificationService.CreateAsync(tenantId, request, cancellationToken);
        return StatusCode(StatusCodes.Status201Created, ApiResponse<NotificationDto>.Success(result));
    }
}
