using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SupportFlow.Customer.Application.Customers.Commands.CreateCustomer;
using SupportFlow.Customer.Application.Customers.Queries.ListCustomers;
using SupportFlow.Customer.Application.Common.Exceptions;
using SupportFlow.Customer.Application.Common.Interfaces;
using SupportFlow.Shared.Contracts.Common;
using SupportFlow.Shared.Contracts.Customers;

namespace SupportFlow.Customer.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/customers")]
public sealed class CustomersController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ICurrentUserService _currentUser;
    private readonly ICustomerService _customerService;

    public CustomersController(
        IMediator mediator,
        ICurrentUserService currentUser,
        ICustomerService customerService)
    {
        _mediator = mediator;
        _currentUser = currentUser;
        _customerService = customerService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<CustomerDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> List(
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken cancellationToken = default)
    {
        var result = await _mediator.Send(new ListCustomersQuery(search, page, pageSize), cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<CustomerDto>>.Success(result, new { page, pageSize }));
    }

    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<CustomerDto>), StatusCodes.Status201Created)]
    public async Task<IActionResult> Create(
        [FromBody] CreateCustomerRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(
            new CreateCustomerCommand(request.Name, request.Email, request.Username),
            cancellationToken);

        return StatusCode(StatusCodes.Status201Created, ApiResponse<CustomerDto>.Success(result));
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<CustomerDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var tenantId = RequireTenant();
        var result = await _customerService.GetByIdAsync(tenantId, id, cancellationToken)
            ?? throw new NotFoundException("Customer was not found.");
        return Ok(ApiResponse<CustomerDto>.Success(result));
    }

    [HttpPatch("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<CustomerDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Update(
        Guid id,
        [FromBody] UpdateCustomerRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _customerService.UpdateAsync(
            RequireTenant(),
            id,
            _currentUser.UserId,
            request.Name,
            request.Email,
            request.Username,
            request.Tags,
            request.Metadata,
            cancellationToken);
        return Ok(ApiResponse<CustomerDto>.Success(result));
    }

    [HttpGet("{id:guid}/notes")]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<CustomerNoteDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ListNotes(Guid id, CancellationToken cancellationToken)
    {
        var result = await _customerService.ListNotesAsync(RequireTenant(), id, cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<CustomerNoteDto>>.Success(result));
    }

    [HttpPost("{id:guid}/notes")]
    [ProducesResponseType(typeof(ApiResponse<CustomerNoteDto>), StatusCodes.Status201Created)]
    public async Task<IActionResult> AddNote(
        Guid id,
        [FromBody] CreateCustomerNoteRequest request,
        CancellationToken cancellationToken)
    {
        if (_currentUser.UserId is null)
        {
            throw new UnauthorizedException("User context is required.");
        }

        var result = await _customerService.AddNoteAsync(
            RequireTenant(),
            id,
            _currentUser.UserId.Value,
            request.Body,
            cancellationToken);
        return StatusCode(StatusCodes.Status201Created, ApiResponse<CustomerNoteDto>.Success(result));
    }

    private Guid RequireTenant() =>
        _currentUser.TenantId
        ?? throw new UnauthorizedException("Tenant context is required.");
}
