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
    IReadOnlyList<string> Tags,
    IReadOnlyDictionary<string, string> Metadata,
    DateTime FirstSeenAt,
    DateTime LastSeenAt,
    DateTime CreatedAt,
    DateTime? UpdatedAt);

public sealed record UpdateCustomerRequest(
    string? Name = null,
    string? Email = null,
    string? Username = null,
    IReadOnlyList<string>? Tags = null,
    IReadOnlyDictionary<string, string>? Metadata = null);

public sealed record CreateCustomerNoteRequest(string Body);

public sealed record CustomerNoteDto(
    Guid Id,
    Guid CustomerId,
    Guid AuthorId,
    string Body,
    DateTime CreatedAt);
