using System.Security.Claims;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SupportFlow.Shared.Contracts.Workspaces;
using SupportFlow.Shared.Kernel.Interfaces;

namespace SupportFlow.Conversation.Infrastructure.Auth;

public static class ApiKeyAuthDefaults
{
    public const string Scheme = "ApiKey";
    public const string HeaderName = "X-Api-Key";
}

public sealed class ApiKeyAuthenticationHandler : AuthenticationHandler<AuthenticationSchemeOptions>
{
    private readonly IApiKeyValidator _validator;
    private readonly ITenantContext _tenantContext;

    public ApiKeyAuthenticationHandler(
        IOptionsMonitor<AuthenticationSchemeOptions> options,
        ILoggerFactory logger,
        UrlEncoder encoder,
        IApiKeyValidator validator,
        ITenantContext tenantContext)
        : base(options, logger, encoder)
    {
        _validator = validator;
        _tenantContext = tenantContext;
    }

    protected override async Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        if (!Request.Headers.TryGetValue(ApiKeyAuthDefaults.HeaderName, out var headerValues))
        {
            // SignalR WebSockets pass the key as access_token / api_key query.
            var queryKey = Request.Query["api_key"].FirstOrDefault()
                ?? Request.Query["access_token"].FirstOrDefault();
            if (string.IsNullOrWhiteSpace(queryKey))
            {
                return AuthenticateResult.NoResult();
            }

            headerValues = queryKey;
        }

        var apiKey = headerValues.FirstOrDefault();
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            return AuthenticateResult.Fail("API key is required.");
        }

        ValidateApiKeyResponse? validated;
        try
        {
            validated = await _validator.ValidateAsync(apiKey, Context.RequestAborted);
        }
        catch (Exception ex)
        {
            Logger.LogWarning(ex, "API key validation failed due to upstream error.");
            return AuthenticateResult.Fail("Unable to validate API key.");
        }

        if (validated is null)
        {
            return AuthenticateResult.Fail("Invalid API key.");
        }

        if (validated.AllowedDomains.Count > 0)
        {
            var originHost = ResolveRequestHost();
            if (originHost is not null
                && !validated.AllowedDomains.Any(d =>
                    string.Equals(d, originHost, StringComparison.OrdinalIgnoreCase)
                    || originHost.EndsWith("." + d, StringComparison.OrdinalIgnoreCase)))
            {
                return AuthenticateResult.Fail("Origin is not allowed for this API key.");
            }
        }

        _tenantContext.SetTenant(validated.TenantId);

        var claims = new List<Claim>
        {
            new("tenant_id", validated.TenantId.ToString()),
            new("api_key_id", validated.ApiKeyId.ToString()),
            new("workspace_name", validated.WorkspaceName),
            new("auth_type", "api_key"),
        };

        if (!string.IsNullOrWhiteSpace(validated.SettingsJson))
        {
            claims.Add(new Claim("workspace_settings", validated.SettingsJson));
        }

        var identity = new ClaimsIdentity(claims, ApiKeyAuthDefaults.Scheme);
        var principal = new ClaimsPrincipal(identity);
        var ticket = new AuthenticationTicket(principal, ApiKeyAuthDefaults.Scheme);
        return AuthenticateResult.Success(ticket);
    }

    private string? ResolveRequestHost()
    {
        var origin = Request.Headers.Origin.FirstOrDefault();
        if (!string.IsNullOrWhiteSpace(origin) && Uri.TryCreate(origin, UriKind.Absolute, out var originUri))
        {
            return originUri.Host;
        }

        var referer = Request.Headers.Referer.FirstOrDefault();
        if (!string.IsNullOrWhiteSpace(referer) && Uri.TryCreate(referer, UriKind.Absolute, out var refererUri))
        {
            return refererUri.Host;
        }

        return null;
    }
}
