using MediatR;
using Microsoft.AspNetCore.Mvc;
using SupportFlow.Identity.Application.Health.Queries;

namespace SupportFlow.Identity.Api.Controllers;

[ApiController]
[Route("health")]
public sealed class HealthController : ControllerBase
{
    private readonly IMediator _mediator;

    public HealthController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new GetHealthQuery(), cancellationToken);
        return Ok(result);
    }
}
