using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SupportFlow.Shared.Contracts.Common;
using SupportFlow.Shared.Contracts.Tickets;
using SupportFlow.Ticket.Application.Tickets.Commands.AddTicketComment;
using SupportFlow.Ticket.Application.Tickets.Commands.CreateTicket;
using SupportFlow.Ticket.Application.Tickets.Commands.UpdateTicket;
using SupportFlow.Ticket.Application.Tickets.Queries.GetTicket;
using SupportFlow.Ticket.Application.Tickets.Queries.ListTicketComments;
using SupportFlow.Ticket.Application.Tickets.Queries.ListTickets;

namespace SupportFlow.Ticket.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/tickets")]
public sealed class TicketsController : ControllerBase
{
    private readonly IMediator _mediator;

    public TicketsController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<TicketDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> List(
        [FromQuery] string? status,
        [FromQuery] string? priority,
        [FromQuery] string? assignee,
        [FromQuery] Guid? customerId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var result = await _mediator.Send(
            new ListTicketsQuery(status, priority, assignee, customerId, page, pageSize),
            cancellationToken);

        return Ok(ApiResponse<IReadOnlyList<TicketDto>>.Success(
            result.Items,
            new { page = result.Page, pageSize = result.PageSize, totalCount = result.TotalCount }));
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<TicketDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new GetTicketQuery(id), cancellationToken);
        return Ok(ApiResponse<TicketDto>.Success(result));
    }

    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<TicketDto>), StatusCodes.Status201Created)]
    public async Task<IActionResult> Create(
        [FromBody] CreateTicketRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(
            new CreateTicketCommand(
                request.CustomerId,
                request.Subject,
                request.Description,
                request.Priority,
                request.ConversationId,
                request.AssigneeId),
            cancellationToken);

        return StatusCode(StatusCodes.Status201Created, ApiResponse<TicketDto>.Success(result));
    }

    [HttpPatch("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<TicketDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Update(
        Guid id,
        [FromBody] UpdateTicketRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(
            new UpdateTicketCommand(
                id,
                request.Subject,
                request.Description,
                request.Priority,
                request.Status,
                request.AssigneeId,
                request.ClearAssignee),
            cancellationToken);

        return Ok(ApiResponse<TicketDto>.Success(result));
    }

    [HttpGet("{id:guid}/comments")]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<TicketCommentDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ListComments(
        Guid id,
        [FromQuery] bool includeInternal = true,
        CancellationToken cancellationToken = default)
    {
        var result = await _mediator.Send(
            new ListTicketCommentsQuery(id, includeInternal),
            cancellationToken);

        return Ok(ApiResponse<IReadOnlyList<TicketCommentDto>>.Success(result));
    }

    [HttpPost("{id:guid}/comments")]
    [ProducesResponseType(typeof(ApiResponse<TicketCommentDto>), StatusCodes.Status201Created)]
    public async Task<IActionResult> AddComment(
        Guid id,
        [FromBody] CreateTicketCommentRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(
            new AddTicketCommentCommand(id, request.Body, request.IsInternal),
            cancellationToken);

        return StatusCode(StatusCodes.Status201Created, ApiResponse<TicketCommentDto>.Success(result));
    }
}
