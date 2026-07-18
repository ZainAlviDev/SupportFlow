using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SupportFlow.Knowledge.Application.Common.Exceptions;
using SupportFlow.Knowledge.Application.Common.Interfaces;
using SupportFlow.Shared.Contracts.Common;
using SupportFlow.Shared.Contracts.Knowledge;

namespace SupportFlow.Knowledge.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/knowledge/search")]
public sealed class KnowledgeSearchController : ControllerBase
{
    private readonly IKnowledgeSearchService _searchService;
    private readonly ICurrentUserService _currentUser;

    public KnowledgeSearchController(
        IKnowledgeSearchService searchService,
        ICurrentUserService currentUser)
    {
        _searchService = searchService;
        _currentUser = currentUser;
    }

    [HttpPost]
    public async Task<IActionResult> Search(
        [FromBody] KnowledgeSearchRequest request,
        CancellationToken cancellationToken)
    {
        var tenantId = _currentUser.TenantId
            ?? throw new UnauthorizedException("Tenant context is required.");
        var results = await _searchService.SearchAsync(
            tenantId,
            request.Query,
            request.Limit,
            cancellationToken);

        return Ok(ApiResponse<IReadOnlyList<KnowledgeSourceDto>>.Success(results));
    }
}
