namespace SupportFlow.Shared.Contracts.Auth;

public sealed record InvitePreviewResponse(
    string WorkspaceName,
    string Email,
    string Role,
    DateTime ExpiresAt,
    bool AccountExists);

public sealed record AcceptInviteRequest(
    string Token,
    string? Password = null,
    string? FullName = null,
    string? PhoneNumber = null);
