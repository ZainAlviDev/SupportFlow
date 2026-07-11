namespace SupportFlow.Shared.Contracts.Auth;

public sealed record MeResponse(AuthUserDto User, AuthWorkspaceDto Workspace);
