namespace SupportFlow.Shared.Contracts.Customers;

public sealed record CreateCustomerRequest(
    string? Name = null,
    string? Email = null,
    string? Username = null);

public sealed record CustomerDto(
    Guid Id,
    Guid TenantId,
    string? Name,
    string? Email,
    string? Username,
    DateTime FirstSeenAt,
    DateTime LastSeenAt,
    DateTime CreatedAt,
    DateTime? UpdatedAt);
