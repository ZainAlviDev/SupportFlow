using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SupportFlow.Shared.Contracts.Common;
using SupportFlow.Shared.Contracts.Workspaces;
using SupportFlow.Workspace.Application.ApiKeys.Commands.CreateApiKey;
using SupportFlow.Workspace.Application.ApiKeys.Commands.RevokeApiKey;
using SupportFlow.Workspace.Application.ApiKeys.Queries.ListApiKeys;

namespace SupportFlow.Workspace.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/workspaces/current/api-keys")]
public sealed class ApiKeysController : ControllerBase
{
    private readonly IMediator _mediator;

    public ApiKeysController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<ApiKeyDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> List(CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new ListApiKeysQuery(), cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<ApiKeyDto>>.Success(result));
    }

    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<CreatedApiKeyDto>), StatusCodes.Status201Created)]
    public async Task<IActionResult> Create(
        [FromBody] CreateApiKeyRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(
            new CreateApiKeyCommand(request.Name, request.AllowedDomains),
            cancellationToken);

        return StatusCode(StatusCodes.Status201Created, ApiResponse<CreatedApiKeyDto>.Success(result));
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Revoke(Guid id, CancellationToken cancellationToken)
    {
        await _mediator.Send(new RevokeApiKeyCommand(id), cancellationToken);
        return NoContent();
    }
}
