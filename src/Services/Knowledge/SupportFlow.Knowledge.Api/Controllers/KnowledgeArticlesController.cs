using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SupportFlow.Knowledge.Application.Common.Exceptions;
using SupportFlow.Knowledge.Application.Common.Interfaces;
using SupportFlow.Shared.Contracts.Common;
using SupportFlow.Shared.Contracts.Knowledge;

namespace SupportFlow.Knowledge.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/knowledge/articles")]
public sealed class KnowledgeArticlesController : ControllerBase
{
    private readonly IKnowledgeArticleService _articleService;
    private readonly ICurrentUserService _currentUser;

    public KnowledgeArticlesController(
        IKnowledgeArticleService articleService,
        ICurrentUserService currentUser)
    {
        _articleService = articleService;
        _currentUser = currentUser;
    }

    [HttpGet]
    public async Task<IActionResult> List(
        [FromQuery] string? search,
        [FromQuery] string? status,
        [FromQuery] string? category,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 30,
        CancellationToken cancellationToken = default)
    {
        var articles = await _articleService.ListAsync(
            RequireTenant(), search, status, category, page, pageSize, cancellationToken);

        return Ok(ApiResponse<IReadOnlyList<KnowledgeArticleDto>>.Success(
            articles,
            new { page, pageSize }));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var article = await _articleService.GetByIdAsync(RequireTenant(), id, cancellationToken)
            ?? throw new NotFoundException("Knowledge article was not found.");

        return Ok(ApiResponse<KnowledgeArticleDto>.Success(article));
    }

    [HttpPost]
    public async Task<IActionResult> Create(
        [FromBody] CreateKnowledgeArticleRequest request,
        CancellationToken cancellationToken)
    {
        var article = await _articleService.CreateAsync(
            RequireTenant(), _currentUser.UserId, request, cancellationToken);

        return CreatedAtAction(
            nameof(GetById),
            new { id = article.Id },
            ApiResponse<KnowledgeArticleDto>.Success(article));
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(
        Guid id,
        [FromBody] UpdateKnowledgeArticleRequest request,
        CancellationToken cancellationToken)
    {
        var article = await _articleService.UpdateAsync(
            RequireTenant(), id, _currentUser.UserId, request, cancellationToken);

        return Ok(ApiResponse<KnowledgeArticleDto>.Success(article));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        await _articleService.DeleteAsync(
            RequireTenant(), id, _currentUser.UserId, cancellationToken);

        return NoContent();
    }

    private Guid RequireTenant() =>
        _currentUser.TenantId
        ?? throw new UnauthorizedException("Tenant context is required.");
}
