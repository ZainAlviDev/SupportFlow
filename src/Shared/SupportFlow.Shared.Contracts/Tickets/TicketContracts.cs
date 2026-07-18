namespace SupportFlow.Shared.Contracts.Tickets;

public sealed record CreateTicketRequest(
    Guid CustomerId,
    string Subject,
    string? Description = null,
    string? Priority = null,
    Guid? ConversationId = null,
    Guid? AssigneeId = null);

public sealed record UpdateTicketRequest(
    string? Subject = null,
    string? Description = null,
    string? Priority = null,
    string? Status = null,
    Guid? AssigneeId = null,
    bool ClearAssignee = false);

public sealed record TicketDto(
    Guid Id,
    Guid TenantId,
    string TicketNumber,
    Guid CustomerId,
    Guid? ConversationId,
    string Subject,
    string? Description,
    string Priority,
    string Status,
    Guid? AssigneeId,
    DateTime CreatedAt,
    DateTime? UpdatedAt);

public sealed record CreateTicketCommentRequest(string Body, bool IsInternal = false);

public sealed record TicketCommentDto(
    Guid Id,
    Guid TicketId,
    Guid TenantId,
    Guid AuthorId,
    string Body,
    bool IsInternal,
    DateTime CreatedAt);
