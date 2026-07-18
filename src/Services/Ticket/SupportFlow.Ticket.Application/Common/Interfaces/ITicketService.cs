using SupportFlow.Shared.Contracts.Tickets;

namespace SupportFlow.Ticket.Application.Common.Interfaces;

public sealed record TicketListResult(
    IReadOnlyList<TicketDto> Items,
    int Page,
    int PageSize,
    int TotalCount);

public interface ITicketService
{
    Task<TicketListResult> ListAsync(
        Guid tenantId,
        string? status,
        string? priority,
        string? assignee,
        Guid? currentUserId,
        Guid? customerId,
        int page,
        int pageSize,
        CancellationToken cancellationToken);

    Task<TicketDto> GetByIdAsync(Guid tenantId, Guid ticketId, CancellationToken cancellationToken);

    Task<TicketDto> CreateAsync(
        Guid tenantId,
        Guid? createdBy,
        Guid customerId,
        string subject,
        string? description,
        string? priority,
        Guid? conversationId,
        Guid? assigneeId,
        CancellationToken cancellationToken);

    Task<TicketDto> UpdateAsync(
        Guid tenantId,
        Guid ticketId,
        Guid? updatedBy,
        string? subject,
        string? description,
        string? priority,
        string? status,
        Guid? assigneeId,
        bool clearAssignee,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<TicketCommentDto>> ListCommentsAsync(
        Guid tenantId,
        Guid ticketId,
        bool includeInternal,
        CancellationToken cancellationToken);

    Task<TicketCommentDto> AddCommentAsync(
        Guid tenantId,
        Guid ticketId,
        Guid authorId,
        string body,
        bool isInternal,
        CancellationToken cancellationToken);
}
