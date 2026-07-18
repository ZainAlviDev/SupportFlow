using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SupportFlow.Conversation.Application.Conversations.Commands.AssignConversation;
using SupportFlow.Conversation.Application.Conversations.Commands.ChangeConversationStatus;
using SupportFlow.Conversation.Application.Conversations.Commands.CreateConversation;
using SupportFlow.Conversation.Application.Conversations.Commands.SendMessage;
using SupportFlow.Conversation.Application.Conversations.Commands.UnassignConversation;
using SupportFlow.Conversation.Application.Conversations.Commands.UpdateConversation;
using SupportFlow.Conversation.Application.Conversations.Queries.GetConversation;
using SupportFlow.Conversation.Application.Conversations.Queries.ListConversations;
using SupportFlow.Conversation.Application.Conversations.Queries.ListMessages;
using SupportFlow.Shared.Contracts.Common;
using SupportFlow.Shared.Contracts.Conversations;

namespace SupportFlow.Conversation.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/conversations")]
public sealed class ConversationsController : ControllerBase
{
    private readonly IMediator _mediator;

    public ConversationsController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<ConversationDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> List(
        [FromQuery] string? status,
        [FromQuery] string? assignee,
        [FromQuery] Guid? customerId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var result = await _mediator.Send(
            new ListConversationsQuery(status, assignee, customerId, page, pageSize),
            cancellationToken);

        return Ok(ApiResponse<IReadOnlyList<ConversationDto>>.Success(
            result.Items,
            new { page = result.Page, pageSize = result.PageSize, totalCount = result.TotalCount }));
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<ConversationDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new GetConversationQuery(id), cancellationToken);
        return Ok(ApiResponse<ConversationDto>.Success(result));
    }

    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<ConversationDto>), StatusCodes.Status201Created)]
    public async Task<IActionResult> Create(
        [FromBody] CreateConversationRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(
            new CreateConversationCommand(
                request.CustomerId,
                request.Channel,
                request.AssigneeId,
                request.Tags,
                request.InitialMessage),
            cancellationToken);

        return StatusCode(StatusCodes.Status201Created, ApiResponse<ConversationDto>.Success(result));
    }

    [HttpPatch("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<ConversationDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Update(
        Guid id,
        [FromBody] UpdateConversationRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(
            new UpdateConversationCommand(
                id,
                request.Status,
                request.AssigneeId,
                request.ClearAssignee,
                request.SnoozedUntil,
                request.ClearSnooze,
                request.Tags),
            cancellationToken);

        return Ok(ApiResponse<ConversationDto>.Success(result));
    }

    /// <summary>Claim for current agent (omit assigneeId) or assign to a specific agent.</summary>
    [HttpPost("{id:guid}/assign")]
    [ProducesResponseType(typeof(ApiResponse<ConversationDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Assign(
        Guid id,
        [FromBody] AssignConversationRequest? request,
        CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(
            new AssignConversationCommand(id, request?.AssigneeId),
            cancellationToken);

        return Ok(ApiResponse<ConversationDto>.Success(result));
    }

    [HttpPost("{id:guid}/unassign")]
    [ProducesResponseType(typeof(ApiResponse<ConversationDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Unassign(Guid id, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new UnassignConversationCommand(id), cancellationToken);
        return Ok(ApiResponse<ConversationDto>.Success(result));
    }

    [HttpPost("{id:guid}/status")]
    [ProducesResponseType(typeof(ApiResponse<ConversationDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ChangeStatus(
        Guid id,
        [FromBody] ChangeConversationStatusRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(
            new ChangeConversationStatusCommand(id, request.Status, request.SnoozedUntil),
            cancellationToken);

        return Ok(ApiResponse<ConversationDto>.Success(result));
    }

    [HttpGet("{id:guid}/messages")]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<MessageDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ListMessages(
        Guid id,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken cancellationToken = default)
    {
        var result = await _mediator.Send(new ListMessagesQuery(id, page, pageSize), cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<MessageDto>>.Success(
            result.Items,
            new { page = result.Page, pageSize = result.PageSize, totalCount = result.TotalCount }));
    }

    [HttpPost("{id:guid}/messages")]
    [ProducesResponseType(typeof(ApiResponse<MessageDto>), StatusCodes.Status201Created)]
    public async Task<IActionResult> SendMessage(
        Guid id,
        [FromBody] SendMessageRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(
            new SendMessageCommand(id, request.Body, request.IsAiGenerated),
            cancellationToken);

        return StatusCode(StatusCodes.Status201Created, ApiResponse<MessageDto>.Success(result));
    }
}
