namespace SupportFlow.Shared.Contracts.Auth;

public sealed record AuthUserDto(Guid Id, string Email, string FullName);

public sealed record AuthWorkspaceDto(Guid Id, string Name, string Slug, string Role);

public sealed record LoginResponse(
    string AccessToken,
    string RefreshToken,
    int ExpiresIn,
    AuthUserDto User,
    AuthWorkspaceDto Workspace);
