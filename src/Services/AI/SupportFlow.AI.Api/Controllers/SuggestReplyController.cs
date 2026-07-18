using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SupportFlow.AI.Application.Common.Exceptions;
using SupportFlow.AI.Application.Common.Interfaces;
using SupportFlow.Shared.Contracts.Common;
using SupportFlow.Shared.Contracts.Knowledge;

namespace SupportFlow.AI.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/ai")]
public sealed class SuggestReplyController : ControllerBase
{
    private readonly ISuggestReplyService _suggestReplyService;
    private readonly ICurrentUserService _currentUser;

    public SuggestReplyController(
        ISuggestReplyService suggestReplyService,
        ICurrentUserService currentUser)
    {
        _suggestReplyService = suggestReplyService;
        _currentUser = currentUser;
    }

    [HttpPost("suggest-reply")]
    [ProducesResponseType(typeof(ApiResponse<SuggestReplyResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> SuggestReply(
        [FromBody] SuggestReplyRequest request,
        CancellationToken cancellationToken)
    {
        if (_currentUser.TenantId is null)
        {
            throw new UnauthorizedException("Tenant context is required.");
        }

        if (_currentUser.UserId is null)
        {
            throw new UnauthorizedException("User context is required.");
        }

        if (request.ConversationId == Guid.Empty)
        {
            throw new ArgumentException("conversationId is required.");
        }

        var result = await _suggestReplyService.SuggestReplyAsync(request, cancellationToken);
        return Ok(ApiResponse<SuggestReplyResponse>.Success(result));
    }
}
