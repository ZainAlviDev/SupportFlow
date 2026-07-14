namespace SupportFlow.Shared.Contracts.Auth;

public sealed record VerifyEmailRequest(string Email, string Code);
