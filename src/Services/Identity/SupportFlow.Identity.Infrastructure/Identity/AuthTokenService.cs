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

public sealed class AuthTokenService : IAuthTokenService
{
    private readonly UserManager<User> _userManager;
    private readonly ApplicationDbContext _dbContext;
    private readonly JwtTokenService _jwtTokenService;

    public AuthTokenService(
        UserManager<User> userManager,
        ApplicationDbContext dbContext,
        JwtTokenService jwtTokenService)
    {
        _userManager = userManager;
        _dbContext = dbContext;
        _jwtTokenService = jwtTokenService;
    }

    public async Task<LoginResponse> RefreshAsync(string refreshToken, CancellationToken cancellationToken)
    {
        var tokenHash = JwtTokenService.HashToken(refreshToken);
        var storedToken = await _dbContext.RefreshTokens
            .FirstOrDefaultAsync(token => token.TokenHash == tokenHash, cancellationToken);

        if (storedToken is null
            || storedToken.RevokedAt is not null
            || storedToken.ExpiresAt <= DateTime.UtcNow)
        {
            throw new UnauthorizedException("Refresh token is invalid or expired.");
        }

        var user = await _userManager.Users
            .FirstOrDefaultAsync(u => u.Id == storedToken.UserId, cancellationToken);

        if (user is null || user.IsDeleted || user.Status != EntityStatus.Active)
        {
            throw new UnauthorizedException("User account is not available.");
        }

        var membership = await _dbContext.TenantMembers
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

        storedToken.RevokedAt = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync(cancellationToken);

        var (accessToken, newRefreshToken, expiresIn) = await _jwtTokenService.CreateTokensAsync(
            user,
            membership,
            tenant,
            cancellationToken);

        return new LoginResponse(
            AccessToken: accessToken,
            RefreshToken: newRefreshToken,
            ExpiresIn: expiresIn,
            User: new AuthUserDto(user.Id, user.Email ?? string.Empty, user.FullName),
            Workspace: new AuthWorkspaceDto(
                tenant.Id,
                tenant.Name,
                tenant.Slug,
                membership.Role.ToString()));
    }

    public async Task LogoutAsync(string refreshToken, CancellationToken cancellationToken)
    {
        var tokenHash = JwtTokenService.HashToken(refreshToken);
        var storedToken = await _dbContext.RefreshTokens
            .FirstOrDefaultAsync(token => token.TokenHash == tokenHash, cancellationToken);

        if (storedToken is null || storedToken.RevokedAt is not null)
        {
            return;
        }

        storedToken.RevokedAt = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync(cancellationToken);
    }
}
