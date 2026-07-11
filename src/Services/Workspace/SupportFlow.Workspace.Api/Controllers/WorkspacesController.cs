using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SupportFlow.Shared.Contracts.Common;
using SupportFlow.Shared.Contracts.Workspaces;
using SupportFlow.Workspace.Application.Workspaces.Commands.CreateWorkspace;
using SupportFlow.Workspace.Application.Workspaces.Commands.UpdateCurrentWorkspace;
using SupportFlow.Workspace.Application.Workspaces.Queries.GetCurrentWorkspace;

namespace SupportFlow.Workspace.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/workspaces")]
public sealed class WorkspacesController : ControllerBase
{
    private readonly IMediator _mediator;

    public WorkspacesController(IMediator mediator) => _mediator = mediator;

    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<WorkspaceDto>), StatusCodes.Status201Created)]
    public async Task<IActionResult> Create([FromBody] CreateWorkspaceRequest request, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(
            new CreateWorkspaceCommand(request.Name, request.Slug, request.Timezone),
            cancellationToken);

        return StatusCode(StatusCodes.Status201Created, ApiResponse<WorkspaceDto>.Success(result));
    }

    [HttpGet("current")]
    [ProducesResponseType(typeof(ApiResponse<WorkspaceDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCurrent(CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new GetCurrentWorkspaceQuery(), cancellationToken);
        return Ok(ApiResponse<WorkspaceDto>.Success(result));
    }

    [HttpPatch("current")]
    [ProducesResponseType(typeof(ApiResponse<WorkspaceDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> UpdateCurrent(
        [FromBody] UpdateWorkspaceRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(
            new UpdateCurrentWorkspaceCommand(request.Name, request.Timezone, request.SettingsJson),
            cancellationToken);

        return Ok(ApiResponse<WorkspaceDto>.Success(result));
    }
}
