using SupportFlow.Shared.Contracts.Auth;

namespace SupportFlow.Identity.Application.Common.Interfaces;

public interface IPasswordResetService
{
    Task<RecoveryOptionsResponse> GetRecoveryOptionsAsync(string email, CancellationToken cancellationToken);

    Task<ForgotPasswordResponse> ForgotAsync(ForgotPasswordRequest request, CancellationToken cancellationToken);

    Task<VerifyResetOtpResponse> VerifyOtpAsync(VerifyResetOtpRequest request, CancellationToken cancellationToken);

    Task ResetAsync(ResetPasswordRequest request, CancellationToken cancellationToken);

    Task<string?> SendEmailVerificationAsync(UserRef user, CancellationToken cancellationToken);

    Task<LoginResponse> VerifyEmailAsync(VerifyEmailRequest request, CancellationToken cancellationToken);
}

/// <summary>Lightweight user reference for verification email after register.</summary>
public sealed record UserRef(Guid Id, string Email);
