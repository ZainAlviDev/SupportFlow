namespace SupportFlow.Shared.Contracts.Auth;

public sealed record RecoveryOptionsResponse(
    bool Found,
    string? Email,
    string? PhoneNumber);
