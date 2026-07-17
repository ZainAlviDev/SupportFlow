using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SupportFlow.Customer.Application.Common.Interfaces;
using SupportFlow.Shared.Contracts.Common;
using SupportFlow.Shared.Contracts.Customers;

namespace SupportFlow.Customer.Api.Controllers;

[ApiController]
[AllowAnonymous]
[Route("api/v1/internal/customers")]
public sealed class InternalCustomersController : ControllerBase
{
    private readonly ICustomerService _customerService;
    private readonly IConfiguration _configuration;

    public InternalCustomersController(ICustomerService customerService, IConfiguration configuration)
    {
        _customerService = customerService;
        _configuration = configuration;
    }

    [HttpPost("upsert")]
    [ProducesResponseType(typeof(ApiResponse<CustomerDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Upsert(
        [FromBody] CreateCustomerRequest request,
        CancellationToken cancellationToken)
    {
        var expected = _configuration["Internal:ServiceKey"];
        if (!string.IsNullOrWhiteSpace(expected))
        {
            var provided = Request.Headers["X-Internal-Key"].FirstOrDefault();
            if (!string.Equals(provided, expected, StringComparison.Ordinal))
            {
                return Unauthorized(new ApiErrorResponse(new ApiErrorBody("UNAUTHORIZED", "Invalid internal service key.")));
            }
        }

        if (!Guid.TryParse(Request.Headers["X-Tenant-Id"].FirstOrDefault(), out var tenantId) || tenantId == Guid.Empty)
        {
            return BadRequest(new ApiErrorResponse(new ApiErrorBody("VALIDATION_ERROR", "X-Tenant-Id header is required.")));
        }

        var result = await _customerService.CreateOrGetAsync(
            tenantId,
            createdBy: null,
            request.Name,
            request.Email,
            request.Username,
            cancellationToken);

        return Ok(ApiResponse<CustomerDto>.Success(result));
    }
}
