using FluentValidation;
using SupportFlow.Identity.Application.Common.Exceptions;
using SupportFlow.Shared.Contracts.Common;

namespace SupportFlow.Identity.Api.Middleware;

public sealed class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;
    private readonly IHostEnvironment _environment;

    public ExceptionHandlingMiddleware(
        RequestDelegate next,
        ILogger<ExceptionHandlingMiddleware> logger,
        IHostEnvironment environment)
    {
        _next = next;
        _logger = logger;
        _environment = environment;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (ValidationException exception)
        {
            _logger.LogWarning(exception, "Validation failed for {Method} {Path}", context.Request.Method, context.Request.Path);

            var details = exception.Errors
                .Select(error => new ApiErrorDetail(error.PropertyName, error.ErrorMessage))
                .ToList();

            await WriteErrorAsync(
                context,
                StatusCodes.Status400BadRequest,
                new ApiErrorResponse(new ApiErrorBody("VALIDATION_ERROR", "Validation failed.", details)));
        }
        catch (UnauthorizedException exception)
        {
            _logger.LogWarning(exception, "Unauthorized request for {Method} {Path}", context.Request.Method, context.Request.Path);

            await WriteErrorAsync(
                context,
                StatusCodes.Status401Unauthorized,
                new ApiErrorResponse(new ApiErrorBody("UNAUTHORIZED", exception.Message)));
        }
        catch (ConflictException exception)
        {
            _logger.LogWarning(exception, "Conflict for {Method} {Path}", context.Request.Method, context.Request.Path);

            await WriteErrorAsync(
                context,
                StatusCodes.Status409Conflict,
                new ApiErrorResponse(new ApiErrorBody("CONFLICT", exception.Message)));
        }
        catch (Exception exception)
        {
            _logger.LogError(exception, "Unhandled exception for {Method} {Path}", context.Request.Method, context.Request.Path);

            var message = _environment.IsDevelopment()
                ? exception.GetBaseException().Message
                : "An unexpected error occurred.";

            await WriteErrorAsync(
                context,
                StatusCodes.Status500InternalServerError,
                new ApiErrorResponse(new ApiErrorBody("INTERNAL_ERROR", message)));
        }
    }

    private static async Task WriteErrorAsync(HttpContext context, int statusCode, ApiErrorResponse payload)
    {
        if (context.Response.HasStarted)
        {
            return;
        }

        context.Response.StatusCode = statusCode;
        context.Response.ContentType = "application/json";
        await context.Response.WriteAsJsonAsync(payload);
    }
}
