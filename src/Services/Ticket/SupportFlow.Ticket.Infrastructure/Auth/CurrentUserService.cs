using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using SupportFlow.Ticket.Application.Common.Interfaces;

namespace SupportFlow.Ticket.Infrastructure.Auth;

public sealed class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUserService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public Guid? UserId
    {
        get
        {
            var value = _httpContextAccessor.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? _httpContextAccessor.HttpContext?.User.FindFirstValue("sub");
            return Guid.TryParse(value, out var userId) ? userId : null;
        }
    }

    public Guid? TenantId
    {
        get
        {
            var value = _httpContextAccessor.HttpContext?.User.FindFirstValue("tenant_id");
            return Guid.TryParse(value, out var tenantId) ? tenantId : null;
        }
    }

    public string? Role => _httpContextAccessor.HttpContext?.User.FindFirstValue("role");
}
