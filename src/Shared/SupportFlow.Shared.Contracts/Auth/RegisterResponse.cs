namespace SupportFlow.Shared.Contracts.Auth;

public sealed record RegisterResponse(
    bool RequiresEmailVerification,
    string Email,
    string? DevOtp = null);
