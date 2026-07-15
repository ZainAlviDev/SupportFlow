namespace SupportFlow.Shared.Contracts.Workspaces;

public sealed record InviteMemberRequest(string Email, string Role);

public sealed record InviteMemberResponse(
    Guid InviteId,
    string Email,
    string Role,
    DateTime ExpiresAt);

public sealed record WorkspaceMemberDto(
    Guid? UserId,
    Guid? InviteId,
    string Email,
    string FullName,
    string Role,
    string Status);
