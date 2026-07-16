using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SupportFlow.Identity.Application.Common.Exceptions;
using SupportFlow.Identity.Application.Common.Interfaces;
using SupportFlow.Identity.Domain.Common;
using SupportFlow.Identity.Domain.Entities;
using SupportFlow.Identity.Domain.Enums;
using SupportFlow.Identity.Infrastructure.Common;
using SupportFlow.Identity.Infrastructure.Persistence;
using SupportFlow.Shared.Contracts.Auth;
using SupportFlow.Shared.Kernel.Enums;

namespace SupportFlow.Identity.Infrastructure.Identity;

public sealed class RegisterService : IRegisterService
{
    private readonly UserManager<User> _userManager;
    private readonly ApplicationDbContext _dbContext;
    private readonly IPasswordResetService _passwordResetService;

    public RegisterService(
        UserManager<User> userManager,
        ApplicationDbContext dbContext,
        IPasswordResetService passwordResetService)
    {
        _userManager = userManager;
        _dbContext = dbContext;
        _passwordResetService = passwordResetService;
    }

    public async Task<RegisterResponse> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken)
    {
        var normalizedEmail = _userManager.NormalizeEmail(request.Email)?.Trim();
        if (string.IsNullOrWhiteSpace(normalizedEmail))
        {
            throw new ConflictException("Enter a valid email address.");
        }

        // Include soft-deleted users so the same email can never be registered twice.
        var existingUser = await _userManager.Users
            .IgnoreQueryFilters()
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

            var phoneE164 = PhoneNumberHelper.ToE164(request.PhoneNumber);

            var phoneTaken = await _userManager.Users
                .IgnoreQueryFilters()
                .AnyAsync(u => u.PhoneNumber == phoneE164, cancellationToken);
            if (phoneTaken)
            {
                throw new ConflictException("An account with this phone number already exists.");
            }

            var user = new User
            {
                Email = request.Email.Trim(),
                UserName = request.Email.Trim(),
                FullName = request.FullName.Trim(),
                PhoneNumber = phoneE164,
                PhoneNumberConfirmed = true,
                EmailConfirmed = false,
                Status = EntityStatus.Active
            };

            var createResult = await _userManager.CreateAsync(user, request.Password);
            if (!createResult.Succeeded)
            {
                if (createResult.Errors.Any(e =>
                        e.Code is "DuplicateEmail" or "DuplicateUserName"))
                {
                    throw new ConflictException("An account with this email already exists.");
                }

                var message = string.Join(" ", createResult.Errors.Select(error => error.Description));
                throw new ConflictException(string.IsNullOrWhiteSpace(message)
                    ? "Unable to create account."
                    : message);
            }

            _dbContext.TenantMembers.Add(new TenantMember
            {
                TenantId = tenant.Id,
                UserId = user.Id,
                Role = TenantRole.Owner,
                Status = EntityStatus.Active
            });

            await _dbContext.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            var devOtp = await _passwordResetService.SendEmailVerificationAsync(
                new UserRef(user.Id, user.Email!),
                cancellationToken);

            return new RegisterResponse(
                RequiresEmailVerification: true,
                Email: user.Email!,
                DevOtp: devOtp);
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

        while (await _dbContext.Tenants
                   .IgnoreQueryFilters()
                   .AnyAsync(t => t.Slug == slug, cancellationToken))
        {
            attempt++;
            slug = $"{baseSlug}-{attempt}";
        }

        return slug;
    }
}
