using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SupportFlow.Customer.Application.Customers.Commands.CreateCustomer;
using SupportFlow.Customer.Application.Customers.Queries.ListCustomers;
using SupportFlow.Shared.Contracts.Common;
using SupportFlow.Shared.Contracts.Customers;

namespace SupportFlow.Customer.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/customers")]
public sealed class CustomersController : ControllerBase
{
    private readonly IMediator _mediator;

    public CustomersController(IMediator mediator) => _mediator = mediator;

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
}
