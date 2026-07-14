namespace SupportFlow.Shared.Contracts.Auth;

public sealed record ForgotPasswordRequest(
    string Channel,
    string? Email,
    string? PhoneNumber);
