using System.Net;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using SupportFlow.Identity.Application.Common.Exceptions;
using SupportFlow.Identity.Application.Common.Interfaces;
using SupportFlow.Identity.Domain.Entities;
using SupportFlow.Identity.Domain.Enums;
using SupportFlow.Identity.Infrastructure.Auth;
using SupportFlow.Identity.Infrastructure.Common;
using SupportFlow.Identity.Infrastructure.Messaging;
using SupportFlow.Identity.Infrastructure.Options;
using SupportFlow.Identity.Infrastructure.Persistence;
using SupportFlow.Shared.Contracts.Auth;
using SupportFlow.Shared.Contracts.Workspaces;
using SupportFlow.Shared.Kernel.Enums;

namespace SupportFlow.Identity.Infrastructure.Identity;

public sealed class MemberInviteService : IMemberInviteService
{
    private readonly ApplicationDbContext _dbContext;
    private readonly UserManager<User> _userManager;
    private readonly ICurrentUserService _currentUser;
    private readonly IEmailSender _emailSender;
    private readonly JwtTokenService _jwtTokenService;
    private readonly AppOptions _appOptions;

    public MemberInviteService(
        ApplicationDbContext dbContext,
        UserManager<User> userManager,
        ICurrentUserService currentUser,
        IEmailSender emailSender,
        JwtTokenService jwtTokenService,
        IOptions<AppOptions> appOptions)
    {
        _dbContext = dbContext;
        _userManager = userManager;
        _currentUser = currentUser;
        _emailSender = emailSender;
        _jwtTokenService = jwtTokenService;
        _appOptions = appOptions.Value;
    }

    public async Task<InviteMemberResponse> InviteAsync(
        InviteMemberRequest request,
        CancellationToken cancellationToken)
    {
        var (tenantId, inviterId) = RequireOwnerOrAdmin();

        var email = request.Email.Trim();
        if (string.IsNullOrWhiteSpace(email) || email.IndexOf('@') < 0)
        {
            throw new ConflictException("Enter a valid email address.");
        }

        var role = ParseInviteRole(request.Role);
        var normalizedEmail = _userManager.NormalizeEmail(email)
            ?? throw new ConflictException("Enter a valid email address.");

        var alreadyMember = await (
            from m in _dbContext.TenantMembers.IgnoreQueryFilters().AsNoTracking()
            join u in _userManager.Users.IgnoreQueryFilters().AsNoTracking() on m.UserId equals u.Id
            where m.TenantId == tenantId
                  && !m.IsDeleted
                  && m.Status == EntityStatus.Active
                  && !u.IsDeleted
                  && u.NormalizedEmail == normalizedEmail
            select m).AnyAsync(cancellationToken);

        if (alreadyMember)
        {
            throw new ConflictException("This email already belongs to a workspace member.");
        }

        // Ignore tenant filter so we always find an existing pending invite for this workspace.
        var openInvite = await _dbContext.TenantInvitations
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(
                i => i.TenantId == tenantId
                     && i.NormalizedEmail == normalizedEmail
                     && i.AcceptedAt == null
                     && !i.IsDeleted,
                cancellationToken);

        var rawToken = Base64UrlEncode(RandomNumberGenerator.GetBytes(32));
        var tokenHash = HashToken(rawToken);
        var expiresAt = DateTime.UtcNow.AddDays(Math.Max(1, _appOptions.InviteExpiryDays));

        if (openInvite is not null)
        {
            openInvite.Email = email;
            openInvite.Role = role;
            openInvite.TokenHash = tokenHash;
            openInvite.ExpiresAt = expiresAt;
            openInvite.InvitedByUserId = inviterId;
            openInvite.UpdatedAt = DateTime.UtcNow;
            openInvite.UpdatedBy = inviterId;
            openInvite.Status = EntityStatus.Active;
            openInvite.IsDeleted = false;
            openInvite.DeletedAt = null;
            openInvite.DeletedBy = null;
        }
        else
        {
            openInvite = new TenantInvitation
            {
                TenantId = tenantId,
                Email = email,
                NormalizedEmail = normalizedEmail,
                Role = role,
                TokenHash = tokenHash,
                ExpiresAt = expiresAt,
                InvitedByUserId = inviterId,
                CreatedBy = inviterId,
                Status = EntityStatus.Active
            };
            _dbContext.TenantInvitations.Add(openInvite);
        }

        try
        {
            await _dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException)
        {
            // Concurrent invite for same email: reload and update instead of inserting again.
            _dbContext.ChangeTracker.Clear();
            openInvite = await _dbContext.TenantInvitations
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(
                    i => i.TenantId == tenantId
                         && i.NormalizedEmail == normalizedEmail
                         && i.AcceptedAt == null
                         && !i.IsDeleted,
                    cancellationToken)
                ?? throw new ConflictException("An invitation for this email is already pending. Try again.");

            openInvite.Email = email;
            openInvite.Role = role;
            openInvite.TokenHash = tokenHash;
            openInvite.ExpiresAt = expiresAt;
            openInvite.InvitedByUserId = inviterId;
            openInvite.UpdatedAt = DateTime.UtcNow;
            openInvite.UpdatedBy = inviterId;
            openInvite.Status = EntityStatus.Active;
            await _dbContext.SaveChangesAsync(cancellationToken);
        }

        var tenant = await _dbContext.Tenants
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == tenantId && !t.IsDeleted, cancellationToken)
            ?? throw new UnauthorizedException("Workspace is not available.");

        var acceptUrl =
            $"{_appOptions.DashboardUrl.TrimEnd('/')}/accept-invite?token={Uri.EscapeDataString(rawToken)}";

        var safeName = WebUtility.HtmlEncode(tenant.Name);
        var safeRole = WebUtility.HtmlEncode(role.ToString());
        var html =
            $"""
            <div style="font-family:Segoe UI,Arial,sans-serif;line-height:1.5;color:#1f2937;max-width:560px;margin:0 auto;">
              <h2 style="margin:0 0 12px;font-size:20px;">You're invited to {safeName}</h2>
              <p style="margin:0 0 16px;">Join this SupportFlow workspace as <strong>{safeRole}</strong>.</p>
              <p style="margin:0 0 24px;">
                <a href="{acceptUrl}"
                   style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600;">
                  Accept invitation
                </a>
              </p>
              <p style="margin:0;font-size:12px;color:#6b7280;">
                This invitation expires {expiresAt:dd MMM yyyy} UTC. If you did not expect this email, you can ignore it.
              </p>
            </div>
            """;

        try
        {
            await _emailSender.SendAsync(
                email,
                $"You're invited to {tenant.Name} on SupportFlow",
                html,
                cancellationToken,
                isHtml: true);
        }
        catch (Exception ex)
        {
            throw new ConflictException(
                $"Invitation was saved, but the email could not be sent via SMTP: {ex.GetBaseException().Message}");
        }

        return new InviteMemberResponse(openInvite.Id, email, role.ToString(), expiresAt);
    }

    public async Task<IReadOnlyList<WorkspaceMemberDto>> ListMembersAsync(CancellationToken cancellationToken)
    {
        var (tenantId, _) = RequireAuthenticatedTenant();

        // IgnoreQueryFilters: tenant filter can capture a stale TenantContext at model build time.
        var active = await (
            from m in _dbContext.TenantMembers.IgnoreQueryFilters().AsNoTracking()
            join u in _userManager.Users.IgnoreQueryFilters().AsNoTracking() on m.UserId equals u.Id
            where m.TenantId == tenantId
                  && !m.IsDeleted
                  && m.Status == EntityStatus.Active
                  && !u.IsDeleted
            orderby m.Role, u.FullName
            select new WorkspaceMemberDto(
                m.UserId,
                null,
                u.Email ?? string.Empty,
                u.FullName,
                m.Role.ToString(),
                "Active")).ToListAsync(cancellationToken);

        var pending = await _dbContext.TenantInvitations
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Where(i =>
                i.TenantId == tenantId
                && i.AcceptedAt == null
                && !i.IsDeleted
                && i.ExpiresAt > DateTime.UtcNow)
            .OrderByDescending(i => i.CreatedAt)
            .Select(i => new WorkspaceMemberDto(
                null,
                i.Id,
                i.Email,
                string.Empty,
                i.Role.ToString(),
                "Pending"))
            .ToListAsync(cancellationToken);

        return active.Concat(pending).ToList();
    }

    public async Task<InvitePreviewResponse> PreviewInviteAsync(
        string token,
        CancellationToken cancellationToken)
    {
        var invite = await FindOpenInviteAsync(token, cancellationToken);
        var tenant = await _dbContext.Tenants
            .IgnoreQueryFilters()
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == invite.TenantId && !t.IsDeleted, cancellationToken)
            ?? throw new UnauthorizedException("This invitation is no longer valid.");

        var accountExists = await _userManager.Users
            .IgnoreQueryFilters()
            .AnyAsync(
                u => u.NormalizedEmail == invite.NormalizedEmail && !u.IsDeleted,
                cancellationToken);

        return new InvitePreviewResponse(
            tenant.Name,
            invite.Email,
            invite.Role.ToString(),
            invite.ExpiresAt,
            accountExists);
    }

    public async Task<LoginResponse> AcceptInviteAsync(
        AcceptInviteRequest request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Token))
        {
            throw new UnauthorizedException("Invitation token is required.");
        }

        var invite = await FindOpenInviteAsync(request.Token, cancellationToken);
        var tenant = await _dbContext.Tenants
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(t => t.Id == invite.TenantId && !t.IsDeleted, cancellationToken)
            ?? throw new UnauthorizedException("This invitation is no longer valid.");

        User user;
        if (_currentUser.UserId is Guid currentUserId)
        {
            user = await _userManager.Users
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(u => u.Id == currentUserId && !u.IsDeleted, cancellationToken)
                ?? throw new UnauthorizedException("Authentication is required.");

            if (!string.Equals(user.NormalizedEmail, invite.NormalizedEmail, StringComparison.Ordinal))
            {
                throw new ConflictException(
                    $"Sign in as {invite.Email} to accept this invitation.");
            }
        }
        else
        {
            var existing = await _userManager.Users
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(
                    u => u.NormalizedEmail == invite.NormalizedEmail && !u.IsDeleted,
                    cancellationToken);

            if (existing is not null)
            {
                if (string.IsNullOrWhiteSpace(request.Password)
                    || !await _userManager.CheckPasswordAsync(existing, request.Password))
                {
                    throw new UnauthorizedException("Enter the password for this account to join.");
                }

                user = existing;
            }
            else
            {
                if (string.IsNullOrWhiteSpace(request.FullName)
                    || string.IsNullOrWhiteSpace(request.Password)
                    || string.IsNullOrWhiteSpace(request.PhoneNumber))
                {
                    throw new ConflictException(
                        "Full name, password, and phone number are required to create your account.");
                }

                var phoneE164 = PhoneNumberHelper.ToE164(request.PhoneNumber);
                var phoneTaken = await _userManager.Users
                    .IgnoreQueryFilters()
                    .AnyAsync(u => u.PhoneNumber == phoneE164, cancellationToken);
                if (phoneTaken)
                {
                    throw new ConflictException("An account with this phone number already exists.");
                }

                user = new User
                {
                    Email = invite.Email,
                    UserName = invite.Email,
                    FullName = request.FullName.Trim(),
                    PhoneNumber = phoneE164,
                    PhoneNumberConfirmed = true,
                    EmailConfirmed = true,
                    Status = EntityStatus.Active
                };

                var createResult = await _userManager.CreateAsync(user, request.Password);
                if (!createResult.Succeeded)
                {
                    var message = string.Join(" ", createResult.Errors.Select(e => e.Description));
                    throw new ConflictException(string.IsNullOrWhiteSpace(message)
                        ? "Unable to create account."
                        : message);
                }
            }
        }

        var alreadyMember = await _dbContext.TenantMembers
            .IgnoreQueryFilters()
            .AnyAsync(
                m => m.TenantId == invite.TenantId
                     && m.UserId == user.Id
                     && !m.IsDeleted
                     && m.Status == EntityStatus.Active,
                cancellationToken);

        if (!alreadyMember)
        {
            _dbContext.TenantMembers.Add(new TenantMember
            {
                TenantId = invite.TenantId,
                UserId = user.Id,
                Role = invite.Role,
                Status = EntityStatus.Active,
                CreatedBy = invite.InvitedByUserId
            });
        }

        invite.AcceptedAt = DateTime.UtcNow;
        invite.UpdatedAt = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync(cancellationToken);

        if (!user.EmailConfirmed)
        {
            user.EmailConfirmed = true;
            await _userManager.UpdateAsync(user);
        }

        var membership = await _dbContext.TenantMembers
            .IgnoreQueryFilters()
            .AsNoTracking()
            .FirstAsync(
                m => m.TenantId == invite.TenantId && m.UserId == user.Id && !m.IsDeleted,
                cancellationToken);

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

    private async Task<TenantInvitation> FindOpenInviteAsync(string token, CancellationToken cancellationToken)
    {
        // Query strings sometimes turn '+' into space; also accept either encoding form.
        var normalized = token.Trim().Replace(' ', '+');
        var hashes = new List<string>
        {
            HashToken(normalized),
            HashToken(token.Trim())
        };

        if (normalized.Contains('-') || normalized.Contains('_'))
        {
            hashes.Add(HashToken(Base64UrlToBase64(normalized)));
        }

        hashes = hashes.Distinct(StringComparer.Ordinal).ToList();

        var invite = await _dbContext.TenantInvitations
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(
                i => hashes.Contains(i.TokenHash) && i.AcceptedAt == null && !i.IsDeleted,
                cancellationToken);

        if (invite is null || invite.ExpiresAt <= DateTime.UtcNow)
        {
            throw new UnauthorizedException("This invitation is invalid or has expired.");
        }

        return invite;
    }

    private (Guid TenantId, Guid UserId) RequireOwnerOrAdmin()
    {
        var context = RequireAuthenticatedTenant();
        var role = _currentUser.Role;
        if (!string.Equals(role, nameof(TenantRole.Owner), StringComparison.OrdinalIgnoreCase)
            && !string.Equals(role, nameof(TenantRole.Admin), StringComparison.OrdinalIgnoreCase))
        {
            throw new UnauthorizedException("Only Owners and Admins can invite team members.");
        }

        return context;
    }

    private (Guid TenantId, Guid UserId) RequireAuthenticatedTenant()
    {
        if (_currentUser.UserId is not Guid userId || _currentUser.TenantId is not Guid tenantId)
        {
            throw new UnauthorizedException("Authentication is required.");
        }

        return (tenantId, userId);
    }

    private static TenantRole ParseInviteRole(string? role)
    {
        if (string.IsNullOrWhiteSpace(role))
        {
            return TenantRole.Agent;
        }

        if (!Enum.TryParse<TenantRole>(role.Trim(), ignoreCase: true, out var parsed)
            || parsed is TenantRole.Owner)
        {
            throw new ConflictException("Role must be Admin, Agent, or Viewer.");
        }

        return parsed;
    }

    private static string HashToken(string token)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(token));
        return Convert.ToHexString(bytes);
    }

    private static string Base64UrlEncode(byte[] data)
    {
        return Convert.ToBase64String(data).TrimEnd('=').Replace('+', '-').Replace('/', '_');
    }

    private static string Base64UrlToBase64(string value)
    {
        var padded = value.Replace('-', '+').Replace('_', '/');
        switch (padded.Length % 4)
        {
            case 2: padded += "=="; break;
            case 3: padded += "="; break;
        }

        return padded;
    }
}
