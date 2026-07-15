using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SupportFlow.Identity.Application.Common.Exceptions;
using SupportFlow.Identity.Application.Common.Interfaces;
using SupportFlow.Identity.Domain.Entities;
using SupportFlow.Identity.Domain.Enums;
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
        var (user, membership, tenant) = await LoadMembershipAsync(userId, tenantId, cancellationToken);

        return new MeResponse(
            new AuthUserDto(user.Id, user.Email ?? string.Empty, user.FullName),
            new AuthWorkspaceDto(tenant.Id, tenant.Name, tenant.Slug, membership.Role.ToString()));
    }

    public async Task<AuthWorkspaceDto> UpdateTenantNameAsync(
        Guid userId,
        Guid tenantId,
        string name,
        CancellationToken cancellationToken)
    {
        var trimmed = name.Trim();
        if (trimmed.Length < 2)
        {
            throw new ConflictException("Workspace name must be at least 2 characters.");
        }

        var (_, membership, tenant) = await LoadMembershipAsync(userId, tenantId, cancellationToken);

        if (membership.Role is not (TenantRole.Owner or TenantRole.Admin))
        {
            throw new ConflictException("Only Owners and Admins can rename the workspace.");
        }

        tenant.Name = trimmed;
        tenant.UpdatedAt = DateTime.UtcNow;
        tenant.UpdatedBy = userId;
        await _dbContext.SaveChangesAsync(cancellationToken);

        return new AuthWorkspaceDto(tenant.Id, tenant.Name, tenant.Slug, membership.Role.ToString());
    }

    private async Task<(User User, TenantMember Membership, Tenant Tenant)> LoadMembershipAsync(
        Guid userId,
        Guid tenantId,
        CancellationToken cancellationToken)
    {
        var user = await _userManager.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);

        if (user is null || user.IsDeleted || user.Status != EntityStatus.Active)
        {
            throw new ConflictException("User account is not available.");
        }

        // Ignore global tenant filters — they capture a stale TenantContext at model build time.
        var membership = await _dbContext.TenantMembers
            .IgnoreQueryFilters()
            .AsNoTracking()
            .FirstOrDefaultAsync(
                m => m.UserId == userId
                     && m.TenantId == tenantId
                     && !m.IsDeleted
                     && m.Status == EntityStatus.Active,
                cancellationToken);

        if (membership is null)
        {
            throw new ConflictException("No active workspace membership found for this account.");
        }

        var tenant = await _dbContext.Tenants
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(
                t => t.Id == tenantId
                     && !t.IsDeleted
                     && t.Status == EntityStatus.Active,
                cancellationToken);

        if (tenant is null)
        {
            throw new ConflictException("Workspace is not available.");
        }

        return (user, membership, tenant);
    }
}
