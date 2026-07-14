using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SupportFlow.Identity.Application.Common.Exceptions;
using SupportFlow.Identity.Application.Common.Interfaces;
using SupportFlow.Identity.Domain.Entities;
using SupportFlow.Identity.Infrastructure.Auth;
using SupportFlow.Identity.Infrastructure.Messaging;
using SupportFlow.Identity.Infrastructure.Options;
using SupportFlow.Identity.Infrastructure.Persistence;
using SupportFlow.Shared.Contracts.Auth;
using SupportFlow.Shared.Kernel.Enums;

namespace SupportFlow.Identity.Infrastructure.Identity;

public sealed class PasswordResetService : IPasswordResetService
{
    public const string EmailVerifyChannel = "email_verify";

    private readonly UserManager<User> _userManager;
    private readonly ApplicationDbContext _dbContext;
    private readonly IEmailOtpSender _emailOtpSender;
    private readonly IWhatsAppOtpSender _whatsAppOtpSender;
    private readonly JwtTokenService _jwtTokenService;
    private readonly OtpOptions _otpOptions;
    private readonly IWebHostEnvironment _environment;
    private readonly ILogger<PasswordResetService> _logger;

    public PasswordResetService(
        UserManager<User> userManager,
        ApplicationDbContext dbContext,
        IEmailOtpSender emailOtpSender,
        IWhatsAppOtpSender whatsAppOtpSender,
        JwtTokenService jwtTokenService,
        IOptions<OtpOptions> otpOptions,
        IWebHostEnvironment environment,
        ILogger<PasswordResetService> logger)
    {
        _userManager = userManager;
        _dbContext = dbContext;
        _emailOtpSender = emailOtpSender;
        _whatsAppOtpSender = whatsAppOtpSender;
        _jwtTokenService = jwtTokenService;
        _otpOptions = otpOptions.Value;
        _environment = environment;
        _logger = logger;
    }

    public async Task<RecoveryOptionsResponse> GetRecoveryOptionsAsync(
        string email,
        CancellationToken cancellationToken)
    {
        var user = await FindUserByEmailAsync(email, cancellationToken);
        if (user is null || user.IsDeleted || user.Status != EntityStatus.Active)
        {
            return new RecoveryOptionsResponse(Found: false, Email: null, PhoneNumber: null);
        }

        return new RecoveryOptionsResponse(
            Found: true,
            Email: user.Email,
            PhoneNumber: user.PhoneNumber);
    }

    public async Task<ForgotPasswordResponse> ForgotAsync(
        ForgotPasswordRequest request,
        CancellationToken cancellationToken)
    {
        var channel = request.Channel.Trim().ToLowerInvariant();
        var user = await FindUserByEmailAsync(request.Email, cancellationToken);

        if (user is null || user.IsDeleted || user.Status != EntityStatus.Active)
        {
            return new ForgotPasswordResponse(Sent: true);
        }

        string? destination = channel switch
        {
            "email" => user.Email,
            "whatsapp" => user.PhoneNumber,
            _ => null
        };

        if (string.IsNullOrWhiteSpace(destination))
        {
            _logger.LogWarning(
                "Password reset via {Channel} but destination missing for user {UserId}",
                channel,
                user.Id);
            return new ForgotPasswordResponse(Sent: true);
        }

        var otp = GenerateOtp(_otpOptions.Length);
        _dbContext.PasswordResetChallenges.Add(new PasswordResetChallenge
        {
            UserId = user.Id,
            Channel = channel,
            CodeHash = Hash(otp),
            ExpiresAt = DateTime.UtcNow.AddMinutes(_otpOptions.ExpiryMinutes)
        });
        await _dbContext.SaveChangesAsync(cancellationToken);

        try
        {
            if (channel == "email")
            {
                await _emailOtpSender.SendAsync(destination, otp, cancellationToken);
            }
            else
            {
                await _whatsAppOtpSender.SendAsync(destination, otp, cancellationToken);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send password-reset OTP via {Channel}", channel);
        }

        return new ForgotPasswordResponse(Sent: true, DevOtp: _environment.IsDevelopment() ? otp : null);
    }

    public async Task<VerifyResetOtpResponse> VerifyOtpAsync(
        VerifyResetOtpRequest request,
        CancellationToken cancellationToken)
    {
        var channel = request.Channel.Trim().ToLowerInvariant();
        var user = await FindUserByEmailAsync(request.Email, cancellationToken)
            ?? throw new UnauthorizedException("Invalid or expired code.");

        var challenge = await GetOpenChallengeAsync(user.Id, channel, cancellationToken)
            ?? throw new UnauthorizedException("Invalid or expired code.");

        await EnsureCodeMatchesAsync(challenge, request.Code, cancellationToken);

        var resetToken = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32));
        challenge.ResetTokenHash = Hash(resetToken);
        challenge.ResetTokenExpiresAt = DateTime.UtcNow.AddMinutes(_otpOptions.ResetTokenExpiryMinutes);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return new VerifyResetOtpResponse(resetToken);
    }

    public async Task ResetAsync(ResetPasswordRequest request, CancellationToken cancellationToken)
    {
        var tokenHash = Hash(request.ResetToken);
        var challenge = await _dbContext.PasswordResetChallenges
            .FirstOrDefaultAsync(
                c =>
                    c.ResetTokenHash == tokenHash
                    && c.ConsumedAt == null
                    && c.ResetTokenExpiresAt != null
                    && c.ResetTokenExpiresAt > DateTime.UtcNow,
                cancellationToken)
            ?? throw new UnauthorizedException("Reset link is invalid or expired.");

        var user = await _userManager.Users
            .FirstOrDefaultAsync(u => u.Id == challenge.UserId, cancellationToken)
            ?? throw new UnauthorizedException("Reset link is invalid or expired.");

        if (user.IsDeleted || user.Status != EntityStatus.Active)
        {
            throw new UnauthorizedException("Reset link is invalid or expired.");
        }

        var identityToken = await _userManager.GeneratePasswordResetTokenAsync(user);
        var result = await _userManager.ResetPasswordAsync(user, identityToken, request.NewPassword);
        if (!result.Succeeded)
        {
            var message = string.Join(" ", result.Errors.Select(e => e.Description));
            throw new ConflictException(string.IsNullOrWhiteSpace(message)
                ? "Unable to reset password."
                : message);
        }

        challenge.ConsumedAt = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<string?> SendEmailVerificationAsync(UserRef user, CancellationToken cancellationToken)
    {
        var otp = GenerateOtp(_otpOptions.Length);
        _dbContext.PasswordResetChallenges.Add(new PasswordResetChallenge
        {
            UserId = user.Id,
            Channel = EmailVerifyChannel,
            CodeHash = Hash(otp),
            ExpiresAt = DateTime.UtcNow.AddMinutes(_otpOptions.ExpiryMinutes)
        });
        await _dbContext.SaveChangesAsync(cancellationToken);

        try
        {
            await _emailOtpSender.SendAsync(user.Email, otp, cancellationToken, purpose: "verify");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email verification OTP to {Email}", user.Email);
        }

        return _environment.IsDevelopment() ? otp : null;
    }

    public async Task<LoginResponse> VerifyEmailAsync(
        VerifyEmailRequest request,
        CancellationToken cancellationToken)
    {
        var user = await FindUserByEmailAsync(request.Email, cancellationToken)
            ?? throw new UnauthorizedException("Invalid or expired code.");

        if (user.IsDeleted || user.Status != EntityStatus.Active)
        {
            throw new UnauthorizedException("Invalid or expired code.");
        }

        if (!user.EmailConfirmed)
        {
            var challenge = await GetOpenChallengeAsync(user.Id, EmailVerifyChannel, cancellationToken)
                ?? throw new UnauthorizedException("Invalid or expired code.");

            await EnsureCodeMatchesAsync(challenge, request.Code, cancellationToken);
            challenge.ConsumedAt = DateTime.UtcNow;
            user.EmailConfirmed = true;
            await _dbContext.SaveChangesAsync(cancellationToken);
        }

        var membership = await _dbContext.TenantMembers
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Where(m =>
                m.UserId == user.Id
                && !m.IsDeleted
                && m.Status == EntityStatus.Active)
            .OrderBy(m => m.Role)
            .FirstOrDefaultAsync(cancellationToken)
            ?? throw new UnauthorizedException("No active workspace membership found for this account.");

        var tenant = await _dbContext.Tenants
            .IgnoreQueryFilters()
            .AsNoTracking()
            .FirstOrDefaultAsync(
                t => t.Id == membership.TenantId && !t.IsDeleted && t.Status == EntityStatus.Active,
                cancellationToken)
            ?? throw new UnauthorizedException("Workspace is not available.");

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

    private async Task<PasswordResetChallenge?> GetOpenChallengeAsync(
        Guid userId,
        string channel,
        CancellationToken cancellationToken)
    {
        return await _dbContext.PasswordResetChallenges
            .Where(c =>
                c.UserId == userId
                && c.Channel == channel
                && c.ConsumedAt == null
                && c.ExpiresAt > DateTime.UtcNow)
            .OrderByDescending(c => c.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken);
    }

    private async Task EnsureCodeMatchesAsync(
        PasswordResetChallenge challenge,
        string code,
        CancellationToken cancellationToken)
    {
        if (challenge.Attempts >= _otpOptions.MaxAttempts)
        {
            throw new UnauthorizedException("Too many attempts. Request a new code.");
        }

        challenge.Attempts += 1;
        if (!FixedTimeEquals(challenge.CodeHash, Hash(code.Trim())))
        {
            await _dbContext.SaveChangesAsync(cancellationToken);
            throw new UnauthorizedException("Invalid or expired code.");
        }
    }

    private async Task<User?> FindUserByEmailAsync(string? email, CancellationToken cancellationToken)
    {
        var normalized = _userManager.NormalizeEmail(email ?? string.Empty);
        if (string.IsNullOrWhiteSpace(normalized))
        {
            return null;
        }

        return await _userManager.Users
            .FirstOrDefaultAsync(u => u.NormalizedEmail == normalized, cancellationToken);
    }

    private static string GenerateOtp(int length)
    {
        var max = (int)Math.Pow(10, length);
        var value = RandomNumberGenerator.GetInt32(0, max);
        return value.ToString($"D{length}");
    }

    private static string Hash(string value)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(value));
        return Convert.ToHexString(bytes);
    }

    private static bool FixedTimeEquals(string left, string right)
    {
        var a = Encoding.UTF8.GetBytes(left);
        var b = Encoding.UTF8.GetBytes(right);
        return a.Length == b.Length && CryptographicOperations.FixedTimeEquals(a, b);
    }
}
