using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SupportFlow.Identity.Application.Identity.Commands.AcceptInvite;
using SupportFlow.Identity.Application.Identity.Commands.ForgotPassword;
using SupportFlow.Identity.Application.Identity.Commands.GetRecoveryOptions;
using SupportFlow.Identity.Application.Identity.Commands.Login;
using SupportFlow.Identity.Application.Identity.Commands.Logout;
using SupportFlow.Identity.Application.Identity.Commands.RefreshToken;
using SupportFlow.Identity.Application.Identity.Commands.Register;
using SupportFlow.Identity.Application.Identity.Commands.ResetPassword;
using SupportFlow.Identity.Application.Identity.Commands.UpdateTenant;
using SupportFlow.Identity.Application.Identity.Commands.VerifyEmail;
using SupportFlow.Identity.Application.Identity.Commands.VerifyResetOtp;
using SupportFlow.Identity.Application.Identity.Queries.GetMe;
using SupportFlow.Identity.Application.Identity.Queries.PreviewInvite;
using SupportFlow.Shared.Contracts.Auth;
using SupportFlow.Shared.Contracts.Common;

namespace SupportFlow.Identity.Api.Controllers;

[ApiController]
[Route("api/v1/auth")]
public sealed class AuthController : ControllerBase
{
    private readonly IMediator _mediator;

    public AuthController(IMediator mediator) => _mediator = mediator;

    [HttpPost("register")]
    [ProducesResponseType(typeof(ApiResponse<RegisterResponse>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(
            new RegisterCommand(
                request.Email,
                request.Password,
                request.FullName,
                request.WorkspaceName,
                request.PhoneNumber),
            cancellationToken);

        return StatusCode(StatusCodes.Status201Created, ApiResponse<RegisterResponse>.Success(result));
    }

    [HttpPost("login")]
    [ProducesResponseType(typeof(ApiResponse<LoginResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login([FromBody] LoginRequest request, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(
            new LoginCommand(request.Email, request.Password),
            cancellationToken);

        return Ok(ApiResponse<LoginResponse>.Success(result));
    }

    [HttpPost("refresh")]
    [ProducesResponseType(typeof(ApiResponse<LoginResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Refresh([FromBody] RefreshTokenRequest request, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(
            new RefreshTokenCommand(request.RefreshToken),
            cancellationToken);

        return Ok(ApiResponse<LoginResponse>.Success(result));
    }

    [HttpPost("logout")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Logout([FromBody] LogoutRequest request, CancellationToken cancellationToken)
    {
        await _mediator.Send(new LogoutCommand(request.RefreshToken), cancellationToken);
        return NoContent();
    }

    [HttpPost("recovery-options")]
    [ProducesResponseType(typeof(ApiResponse<RecoveryOptionsResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> RecoveryOptions(
        [FromBody] RecoveryOptionsRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new GetRecoveryOptionsCommand(request.Email), cancellationToken);
        return Ok(ApiResponse<RecoveryOptionsResponse>.Success(result));
    }

    [HttpPost("forgot-password")]
    [ProducesResponseType(typeof(ApiResponse<ForgotPasswordResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ForgotPassword(
        [FromBody] ForgotPasswordRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(
            new ForgotPasswordCommand(request.Channel, request.Email, request.PhoneNumber),
            cancellationToken);

        return Ok(ApiResponse<ForgotPasswordResponse>.Success(result));
    }

    [HttpPost("verify-reset-otp")]
    [ProducesResponseType(typeof(ApiResponse<VerifyResetOtpResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> VerifyResetOtp(
        [FromBody] VerifyResetOtpRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(
            new VerifyResetOtpCommand(request.Channel, request.Code, request.Email, request.PhoneNumber),
            cancellationToken);

        return Ok(ApiResponse<VerifyResetOtpResponse>.Success(result));
    }

    [HttpPost("reset-password")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> ResetPassword(
        [FromBody] ResetPasswordRequest request,
        CancellationToken cancellationToken)
    {
        await _mediator.Send(
            new ResetPasswordCommand(request.ResetToken, request.NewPassword),
            cancellationToken);

        return NoContent();
    }

    [HttpPost("verify-email")]
    [ProducesResponseType(typeof(ApiResponse<LoginResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> VerifyEmail(
        [FromBody] VerifyEmailRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(
            new VerifyEmailCommand(request.Email, request.Code),
            cancellationToken);

        return Ok(ApiResponse<LoginResponse>.Success(result));
    }

    [AllowAnonymous]
    [HttpGet("invites/preview")]
    [ProducesResponseType(typeof(ApiResponse<InvitePreviewResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> PreviewInvite(
        [FromQuery] string token,
        CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new PreviewInviteQuery(token), cancellationToken);
        return Ok(ApiResponse<InvitePreviewResponse>.Success(result));
    }

    [AllowAnonymous]
    [HttpPost("accept-invite")]
    [ProducesResponseType(typeof(ApiResponse<LoginResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> AcceptInvite(
        [FromBody] AcceptInviteRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(
            new AcceptInviteCommand(
                request.Token,
                request.Password,
                request.FullName,
                request.PhoneNumber),
            cancellationToken);

        return Ok(ApiResponse<LoginResponse>.Success(result));
    }

    [Authorize]
    [HttpGet("me")]
    [ProducesResponseType(typeof(ApiResponse<MeResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Me(CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new GetMeQuery(), cancellationToken);
        return Ok(ApiResponse<MeResponse>.Success(result));
    }

    [Authorize]
    [HttpPatch("tenant")]
    [ProducesResponseType(typeof(ApiResponse<AuthWorkspaceDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> UpdateTenant(
        [FromBody] UpdateTenantRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new UpdateTenantCommand(request.Name), cancellationToken);
        return Ok(ApiResponse<AuthWorkspaceDto>.Success(result));
    }
}
