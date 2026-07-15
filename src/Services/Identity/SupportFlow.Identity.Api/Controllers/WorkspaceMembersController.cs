using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SupportFlow.Identity.Application.Identity.Commands.InviteMember;
using SupportFlow.Identity.Application.Identity.Queries.ListMembers;
using SupportFlow.Shared.Contracts.Common;
using SupportFlow.Shared.Contracts.Workspaces;

namespace SupportFlow.Identity.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/workspaces/current/members")]
public sealed class WorkspaceMembersController : ControllerBase
{
    private readonly IMediator _mediator;

    public WorkspaceMembersController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<WorkspaceMemberDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> List(CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new ListMembersQuery(), cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<WorkspaceMemberDto>>.Success(result));
    }

    [HttpPost("invite")]
    [ProducesResponseType(typeof(ApiResponse<InviteMemberResponse>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Invite(
        [FromBody] InviteMemberRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(
            new InviteMemberCommand(request.Email, request.Role),
            cancellationToken);

        return StatusCode(StatusCodes.Status201Created, ApiResponse<InviteMemberResponse>.Success(result));
    }
}
