namespace SupportFlow.Shared.Contracts.Auth;

public sealed record RegisterRequest(
    string Email,
    string Password,
    string FullName,
    string WorkspaceName,
    string PhoneNumber);
