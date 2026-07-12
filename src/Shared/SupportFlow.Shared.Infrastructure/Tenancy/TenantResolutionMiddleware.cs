using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using SupportFlow.Shared.Kernel.Interfaces;

namespace SupportFlow.Shared.Infrastructure.Tenancy;

/// <summary>
/// Resolves the current tenant from the authenticated JWT <c>tenant_id</c> claim.
/// Must run after <c>UseAuthentication</c>.
/// </summary>
public sealed class TenantResolutionMiddleware
{
    public const string TenantIdClaimType = "tenant_id";

    private readonly RequestDelegate _next;

    public TenantResolutionMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, ITenantContext tenantContext)
    {
        if (context.User.Identity?.IsAuthenticated == true)
        {
            var value = context.User.FindFirstValue(TenantIdClaimType);
            if (Guid.TryParse(value, out var tenantId) && tenantId != Guid.Empty)
            {
                tenantContext.SetTenant(tenantId);
            }
        }

        await _next(context);
    }
}
