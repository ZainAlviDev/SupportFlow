using System.Net.Http.Headers;
using Microsoft.AspNetCore.Http;
using SupportFlow.AI.Application.Common.Exceptions;

namespace SupportFlow.AI.Infrastructure.Gateway;

/// <summary>
/// Forwards the incoming request's bearer token to downstream gateway calls.
/// </summary>
public sealed class BearerTokenForwardingHandler : DelegatingHandler
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public BearerTokenForwardingHandler(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    protected override Task<HttpResponseMessage> SendAsync(
        HttpRequestMessage request,
        CancellationToken cancellationToken)
    {
        var authorization = _httpContextAccessor.HttpContext?.Request.Headers.Authorization.ToString();
        if (string.IsNullOrWhiteSpace(authorization)
            || !authorization.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
        {
            throw new UnauthorizedException("A bearer token is required to call downstream services.");
        }

        request.Headers.Authorization = new AuthenticationHeaderValue(
            "Bearer",
            authorization["Bearer ".Length..].Trim());

        return base.SendAsync(request, cancellationToken);
    }
}
