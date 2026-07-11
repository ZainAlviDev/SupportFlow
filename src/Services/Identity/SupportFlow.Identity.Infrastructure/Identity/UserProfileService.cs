using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SupportFlow.Identity.Application.Common.Exceptions;
using SupportFlow.Identity.Application.Common.Interfaces;
using SupportFlow.Identity.Domain.Entities;
using SupportFlow.Identity.Infrastructure.Persistence;
using SupportFlow.Shared.Contracts.Auth;
using SupportFlow.Shared.Kernel.Enums;

namespace SupportFlow.Identity.Infrastructure.Identity;

public sealed class UserProfileService : IUserProfileService
{
    private readonly UserManager<User> _userManager;
    private readonly ApplicationDbContext _dbContext;

    public UserProfileService(UserManager<User> userManager, ApplicationDbContext dbContext)
    {
        _userManager = userManager;
        _dbContext = dbContext;
    }

    public async Task<MeResponse> GetMeAsync(Guid userId, Guid tenantId, CancellationToken cancellationToken)
    {
        var user = await _userManager.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);

        if (user is null || user.IsDeleted || user.Status != EntityStatus.Active)
        {
            throw new UnauthorizedException("User account is not available.");
        }

        var membership = await _dbContext.TenantMembers
            .AsNoTracking()
            .FirstOrDefaultAsync(
                m => m.UserId == userId
                     && m.TenantId == tenantId
                     && !m.IsDeleted
                     && m.Status == EntityStatus.Active,
                cancellationToken);

        if (membership is null)
        {
            throw new UnauthorizedException("No active workspace membership found for this account.");
        }

        var tenant = await _dbContext.Tenants
            .AsNoTracking()
            .FirstOrDefaultAsync(
                t => t.Id == tenantId
                     && !t.IsDeleted
                     && t.Status == EntityStatus.Active,
                cancellationToken);

        if (tenant is null)
        {
            throw new UnauthorizedException("Workspace is not available.");
        }

        return new MeResponse(
            new AuthUserDto(user.Id, user.Email ?? string.Empty, user.FullName),
            new AuthWorkspaceDto(tenant.Id, tenant.Name, tenant.Slug, membership.Role.ToString()));
    }
}
