namespace SupportFlow.Shared.Contracts.Auth;

public sealed record ForgotPasswordResponse(bool Sent, string? DevOtp = null);
