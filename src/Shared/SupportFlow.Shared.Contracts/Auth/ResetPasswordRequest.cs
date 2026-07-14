namespace SupportFlow.Shared.Contracts.Auth;

public sealed record ResetPasswordRequest(
    string ResetToken,
    string NewPassword);
