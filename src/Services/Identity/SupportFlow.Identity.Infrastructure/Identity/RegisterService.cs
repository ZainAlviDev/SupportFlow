using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SupportFlow.Identity.Application.Common.Exceptions;
using SupportFlow.Identity.Application.Common.Interfaces;
using SupportFlow.Identity.Domain.Common;
using SupportFlow.Identity.Domain.Entities;
using SupportFlow.Identity.Domain.Enums;
using SupportFlow.Identity.Infrastructure.Auth;
using SupportFlow.Identity.Infrastructure.Persistence;
using SupportFlow.Shared.Contracts.Auth;
using SupportFlow.Shared.Kernel.Enums;

namespace SupportFlow.Identity.Infrastructure.Identity;

public sealed class RegisterService : IRegisterService
{
    private readonly UserManager<User> _userManager;
    private readonly ApplicationDbContext _dbContext;
    private readonly JwtTokenService _jwtTokenService;

    public RegisterService(
        UserManager<User> userManager,
        ApplicationDbContext dbContext,
        JwtTokenService jwtTokenService)
    {
        _userManager = userManager;
        _dbContext = dbContext;
        _jwtTokenService = jwtTokenService;
    }

    public async Task<LoginResponse> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken)
    {
        var normalizedEmail = _userManager.NormalizeEmail(request.Email);
        var existingUser = await _userManager.Users
            .AnyAsync(u => u.NormalizedEmail == normalizedEmail, cancellationToken);

        if (existingUser)
        {
            throw new ConflictException("An account with this email already exists.");
        }

        await using var transaction = await _dbContext.Database.BeginTransactionAsync(cancellationToken);

        try
        {
            var slug = await CreateUniqueSlugAsync(request.WorkspaceName, cancellationToken);

            var tenant = new Tenant
            {
                Name = request.WorkspaceName.Trim(),
                Slug = slug,
                Plan = "free",
                Status = EntityStatus.Active
            };

            _dbContext.Tenants.Add(tenant);
            await _dbContext.SaveChangesAsync(cancellationToken);

            var user = new User
            {
                Email = request.Email.Trim(),
                UserName = request.Email.Trim(),
                FullName = request.FullName.Trim(),
                EmailConfirmed = true,
                Status = EntityStatus.Active
            };

            var createResult = await _userManager.CreateAsync(user, request.Password);
            if (!createResult.Succeeded)
            {
                var message = string.Join(" ", createResult.Errors.Select(error => error.Description));
                throw new ConflictException(string.IsNullOrWhiteSpace(message)
                    ? "Unable to create account."
                    : message);
            }

            var membership = new TenantMember
            {
                TenantId = tenant.Id,
                UserId = user.Id,
                Role = TenantRole.Owner,
                Status = EntityStatus.Active
            };

            _dbContext.TenantMembers.Add(membership);
            await _dbContext.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

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
                Workspace: new AuthWorkspaceDto(tenant.Id, tenant.Name, tenant.Slug, membership.Role.ToString()));
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }

    private async Task<string> CreateUniqueSlugAsync(string workspaceName, CancellationToken cancellationToken)
    {
        var baseSlug = SlugGenerator.FromName(workspaceName);
        var slug = baseSlug;
        var attempt = 1;

        while (await _dbContext.Tenants.AnyAsync(t => t.Slug == slug, cancellationToken))
        {
            attempt++;
            slug = $"{baseSlug}-{attempt}";
        }

        return slug;
    }
}
