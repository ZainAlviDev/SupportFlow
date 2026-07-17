using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using SupportFlow.Conversation.Infrastructure.Auth;
using SupportFlow.Conversation.Infrastructure.Widget;
using SupportFlow.Shared.Contracts.Common;
using SupportFlow.Shared.Contracts.Widget;
using SupportFlow.Shared.Kernel.Interfaces;

namespace SupportFlow.Conversation.Api.Controllers;

[ApiController]
[Authorize(AuthenticationSchemes = ApiKeyAuthDefaults.Scheme)]
[EnableRateLimiting("widget")]
[Route("api/v1/widget")]
public sealed class WidgetController : ControllerBase
{
    private readonly IWidgetService _widgetService;
    private readonly ITenantContext _tenantContext;

    public WidgetController(IWidgetService widgetService, ITenantContext tenantContext)
    {
        _widgetService = widgetService;
        _tenantContext = tenantContext;
    }

    [HttpGet("config")]
    [ProducesResponseType(typeof(ApiResponse<WidgetConfigDto>), StatusCodes.Status200OK)]
    public IActionResult GetConfig()
    {
        var config = _widgetService.GetConfig(User);
        return Ok(ApiResponse<WidgetConfigDto>.Success(config));
    }

    [HttpPost("conversations")]
    [ProducesResponseType(typeof(ApiResponse<WidgetConversationDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> StartOrResume(
        [FromBody] StartWidgetConversationRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _widgetService.StartOrResumeAsync(RequireTenantId(), request, cancellationToken);
        return Ok(ApiResponse<WidgetConversationDto>.Success(result));
    }

    [HttpPost("conversations/{id:guid}/messages")]
    [ProducesResponseType(typeof(ApiResponse<WidgetMessageDto>), StatusCodes.Status201Created)]
    public async Task<IActionResult> SendMessage(
        Guid id,
        [FromBody] SendWidgetMessageRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _widgetService.SendMessageAsync(
            RequireTenantId(),
            id,
            request.VisitorId,
            request.Body,
            cancellationToken);

        return StatusCode(StatusCodes.Status201Created, ApiResponse<WidgetMessageDto>.Success(result));
    }

    [HttpGet("conversations/{id:guid}/messages")]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<WidgetMessageDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ListMessages(
        Guid id,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken cancellationToken = default)
    {
        var result = await _widgetService.ListMessagesAsync(
            RequireTenantId(),
            id,
            page,
            pageSize,
            cancellationToken);

        return Ok(ApiResponse<IReadOnlyList<WidgetMessageDto>>.Success(result, new { page, pageSize }));
    }

    private Guid RequireTenantId()
    {
        if (_tenantContext.IsResolved)
        {
            return _tenantContext.TenantId;
        }

        var claim = User.FindFirstValue("tenant_id");
        if (Guid.TryParse(claim, out var tenantId) && tenantId != Guid.Empty)
        {
            return tenantId;
        }

        throw new InvalidOperationException("Tenant context is required.");
    }
}
