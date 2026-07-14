using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SupportFlow.Identity.Application.Common.Exceptions;
using SupportFlow.Identity.Application.Common.Interfaces;
using SupportFlow.Identity.Domain.Entities;
using SupportFlow.Identity.Infrastructure.Auth;
using SupportFlow.Identity.Infrastructure.Persistence;
using SupportFlow.Shared.Contracts.Auth;
using SupportFlow.Shared.Kernel.Enums;

namespace SupportFlow.Identity.Infrastructure.Identity;

public sealed class LoginService : ILoginService
{
    private readonly UserManager<User> _userManager;
    private readonly ApplicationDbContext _dbContext;
    private readonly JwtTokenService _jwtTokenService;

    public LoginService(
        UserManager<User> userManager,
        ApplicationDbContext dbContext,
        JwtTokenService jwtTokenService)
    {
        _userManager = userManager;
        _dbContext = dbContext;
        _jwtTokenService = jwtTokenService;
    }

    public async Task<LoginResponse> LoginAsync(LoginRequest request, CancellationToken cancellationToken)
    {
        var normalizedEmail = _userManager.NormalizeEmail(request.Email);
        var user = await _userManager.Users
            .FirstOrDefaultAsync(
                u => u.NormalizedEmail == normalizedEmail,
                cancellationToken);

        if (user is null
            || user.IsDeleted
            || user.Status != EntityStatus.Active
            || !await _userManager.CheckPasswordAsync(user, request.Password))
        {
            throw new UnauthorizedException();
        }

        if (!user.EmailConfirmed)
        {
            throw new UnauthorizedException("Please verify your email before signing in.");
        }

        // Login is pre-tenant: bypass global tenant filter to find the user's membership.
        var membership = await _dbContext.TenantMembers
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Where(m =>
                m.UserId == user.Id
                && !m.IsDeleted
                && m.Status == EntityStatus.Active)
            .OrderBy(m => m.Role)
            .FirstOrDefaultAsync(cancellationToken);

        if (membership is null)
        {
            throw new UnauthorizedException("No active workspace membership found for this account.");
        }

        var tenant = await _dbContext.Tenants
            .IgnoreQueryFilters()
            .AsNoTracking()
            .FirstOrDefaultAsync(
                t => t.Id == membership.TenantId
                     && !t.IsDeleted
                     && t.Status == EntityStatus.Active,
                cancellationToken);

        if (tenant is null)
        {
            throw new UnauthorizedException("Workspace is not available.");
        }

        var (accessToken, refreshToken, expiresIn) = await _jwtTokenService.CreateTokensAsync(
            user,
            membership,
            tenant,
            cancellationToken);

        return new LoginResponse(
            AccessToken: accessToken,
            RefreshToken: refreshToken,
            ExpiresIn: expiresIn,
            User: new AuthUserDto(user.Id, user.Email ?? string.Empty, user.FullName),
            Workspace: new AuthWorkspaceDto(
                tenant.Id,
                tenant.Name,
                tenant.Slug,
                membership.Role.ToString()));
    }
}
