using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SupportFlow.Shared.Contracts.Common;
using SupportFlow.Shared.Contracts.Workspaces;
using SupportFlow.Workspace.Application.Common.Interfaces;

namespace SupportFlow.Workspace.Api.Controllers;

/// <summary>
/// Internal lookup used by Conversation for widget X-Api-Key validation.
/// </summary>
[ApiController]
[AllowAnonymous]
[Route("api/v1/internal/api-keys")]
public sealed class InternalApiKeysController : ControllerBase
{
    private readonly IApiKeyService _apiKeyService;
    private readonly IConfiguration _configuration;

    public InternalApiKeysController(IApiKeyService apiKeyService, IConfiguration configuration)
    {
        _apiKeyService = apiKeyService;
        _configuration = configuration;
    }

    [HttpPost("validate")]
    [ProducesResponseType(typeof(ApiResponse<ValidateApiKeyResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Validate(
        [FromBody] ValidateApiKeyRequest request,
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

        var result = await _apiKeyService.ValidateAsync(request.ApiKey, cancellationToken);
        if (result is null)
        {
            return Unauthorized(new ApiErrorResponse(new ApiErrorBody("UNAUTHORIZED", "Invalid API key.")));
        }

        return Ok(ApiResponse<ValidateApiKeyResponse>.Success(result));
    }
}
