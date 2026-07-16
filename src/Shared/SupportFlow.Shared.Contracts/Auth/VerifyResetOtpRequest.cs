namespace SupportFlow.Shared.Contracts.Auth;

public sealed record VerifyResetOtpRequest(
    string Channel,
    string Code,
    string? Email,
    string? PhoneNumber);
