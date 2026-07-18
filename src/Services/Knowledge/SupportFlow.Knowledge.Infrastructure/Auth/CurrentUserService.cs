using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using SupportFlow.Knowledge.Application.Common.Interfaces;

namespace SupportFlow.Knowledge.Infrastructure.Auth;

public sealed class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUserService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public Guid? UserId => ReadGuidClaim(ClaimTypes.NameIdentifier, "sub");
    public Guid? TenantId => ReadGuidClaim("tenant_id");
    public string? Role => _httpContextAccessor.HttpContext?.User.FindFirstValue("role");

    private Guid? ReadGuidClaim(params string[] claimTypes)
    {
        var user = _httpContextAccessor.HttpContext?.User;
        foreach (var claimType in claimTypes)
        {
            if (Guid.TryParse(user?.FindFirstValue(claimType), out var value))
            {
                return value;
            }
        }

        return null;
    }
}
