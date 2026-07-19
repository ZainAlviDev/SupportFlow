using Microsoft.EntityFrameworkCore;
using SupportFlow.Shared.Contracts.Notifications;
using SupportFlow.Shared.Contracts.Tickets;
using SupportFlow.Shared.Kernel.Enums;
using SupportFlow.Ticket.Application.Common.Exceptions;
using SupportFlow.Ticket.Application.Common.Interfaces;
using SupportFlow.Ticket.Domain.Enums;
using SupportFlow.Ticket.Infrastructure.Notifications;
using SupportFlow.Ticket.Infrastructure.Persistence;
using TicketEntity = SupportFlow.Ticket.Domain.Entities.Ticket;

namespace SupportFlow.Ticket.Infrastructure.Tickets;

public sealed class TicketService : ITicketService
{
    private readonly TicketDbContext _dbContext;
    private readonly INotificationClient _notificationClient;

    public TicketService(TicketDbContext dbContext, INotificationClient notificationClient)
    {
        _dbContext = dbContext;
        _notificationClient = notificationClient;
    }

    public async Task<TicketListResult> ListAsync(
        Guid tenantId,
        string? status,
        string? priority,
        string? assignee,
        Guid? currentUserId,
        Guid? customerId,
        int page,
        int pageSize,
        CancellationToken cancellationToken)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = _dbContext.Tickets
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Where(t => t.TenantId == tenantId && !t.IsDeleted && t.Status == EntityStatus.Active);

        if (!string.IsNullOrWhiteSpace(status) && TryParseStatus(status, out var ticketStatus))
        {
            query = query.Where(t => t.TicketStatus == ticketStatus);
        }

        if (!string.IsNullOrWhiteSpace(priority) && TryParsePriority(priority, out var ticketPriority))
        {
            query = query.Where(t => t.Priority == ticketPriority);
        }

        if (customerId is not null)
        {
            query = query.Where(t => t.CustomerId == customerId);
        }

        if (!string.IsNullOrWhiteSpace(assignee))
        {
            if (string.Equals(assignee, "me", StringComparison.OrdinalIgnoreCase))
            {
                if (currentUserId is null)
                {
                    throw new UnauthorizedException("User context is required for assignee=me.");
                }

                query = query.Where(t => t.AssigneeId == currentUserId);
            }
            else if (string.Equals(assignee, "unassigned", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(t => t.AssigneeId == null);
            }
            else if (Guid.TryParse(assignee, out var assigneeId))
            {
                query = query.Where(t => t.AssigneeId == assigneeId);
            }
            else
            {
                throw new ConflictException("assignee must be 'me', 'unassigned', or a user id.");
            }
        }

        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(t => t.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return new TicketListResult(items.Select(Map).ToList(), page, pageSize, total);
    }

    public async Task<TicketDto> GetByIdAsync(Guid tenantId, Guid ticketId, CancellationToken cancellationToken)
    {
        var ticket = await FindAsync(tenantId, ticketId, tracking: false, cancellationToken);
        return Map(ticket);
    }

    public async Task<TicketDto> CreateAsync(
        Guid tenantId,
        Guid? createdBy,
        Guid customerId,
        string subject,
        string? description,
        string? priority,
        Guid? conversationId,
        Guid? assigneeId,
        CancellationToken cancellationToken)
    {
        var parsedPriority = TicketPriority.Medium;
        if (!string.IsNullOrWhiteSpace(priority) && !TryParsePriority(priority, out parsedPriority))
        {
            throw new ConflictException("Priority must be Low, Medium, High, or Urgent.");
        }

        var ticketNumber = await NextTicketNumberAsync(tenantId, cancellationToken);
        var ticket = new TicketEntity(
            tenantId,
            customerId,
            subject,
            ticketNumber,
            description,
            parsedPriority,
            conversationId,
            assigneeId)
        {
            CreatedBy = createdBy,
        };

        _dbContext.Tickets.Add(ticket);
        await _dbContext.SaveChangesAsync(cancellationToken);

        if (assigneeId is Guid assignedTo)
        {
            await NotifyTicketAssignedAsync(ticket, assignedTo, cancellationToken);
        }

        return Map(ticket);
    }

    public async Task<TicketDto> UpdateAsync(
        Guid tenantId,
        Guid ticketId,
        Guid? updatedBy,
        string? subject,
        string? description,
        string? priority,
        string? status,
        Guid? assigneeId,
        bool clearAssignee,
        CancellationToken cancellationToken)
    {
        var ticket = await FindAsync(tenantId, ticketId, tracking: true, cancellationToken);

        TicketPriority? parsedPriority = null;
        if (!string.IsNullOrWhiteSpace(priority))
        {
            if (!TryParsePriority(priority, out var value))
            {
                throw new ConflictException("Priority must be Low, Medium, High, or Urgent.");
            }

            parsedPriority = value;
        }

        TicketStatus? parsedStatus = null;
        if (!string.IsNullOrWhiteSpace(status))
        {
            if (!TryParseStatus(status, out var value))
            {
                throw new ConflictException("Status must be New, Open, Pending, Resolved, or Closed.");
            }

            parsedStatus = value;
        }

        var previousAssignee = ticket.AssigneeId;
        ticket.ApplyUpdate(subject, description, parsedPriority, parsedStatus, assigneeId, clearAssignee);
        ticket.UpdatedBy = updatedBy;
        await _dbContext.SaveChangesAsync(cancellationToken);

        if (ticket.AssigneeId is Guid newAssignee
            && newAssignee != previousAssignee)
        {
            await NotifyTicketAssignedAsync(ticket, newAssignee, cancellationToken);
        }

        return Map(ticket);
    }

    private async Task NotifyTicketAssignedAsync(
        TicketEntity ticket,
        Guid assigneeId,
        CancellationToken cancellationToken)
    {
        await _notificationClient.NotifyAsync(
            ticket.TenantId,
            new CreateNotificationRequest(
                UserId: assigneeId,
                Type: "TicketAssigned",
                Title: "Ticket assigned",
                Body: $"Ticket {ticket.TicketNumber} was assigned to you.",
                ResourceType: "ticket",
                ResourceId: ticket.Id,
                IdempotencyKey: $"ticket-assigned:{ticket.Id}:{assigneeId}:{ticket.UpdatedAt?.Ticks ?? ticket.CreatedAt.Ticks}"),
            cancellationToken);
    }

    public async Task<IReadOnlyList<TicketCommentDto>> ListCommentsAsync(
        Guid tenantId,
        Guid ticketId,
        bool includeInternal,
        CancellationToken cancellationToken)
    {
        _ = await FindAsync(tenantId, ticketId, tracking: false, cancellationToken);

        var query = _dbContext.TicketComments
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Where(c => c.TicketId == ticketId && c.TenantId == tenantId);

        if (!includeInternal)
        {
            query = query.Where(c => !c.IsInternal);
        }

        var comments = await query
            .OrderBy(c => c.CreatedAt)
            .ToListAsync(cancellationToken);

        return comments.Select(MapComment).ToList();
    }

    public async Task<TicketCommentDto> AddCommentAsync(
        Guid tenantId,
        Guid ticketId,
        Guid authorId,
        string body,
        bool isInternal,
        CancellationToken cancellationToken)
    {
        _ = await FindAsync(tenantId, ticketId, tracking: false, cancellationToken);

        var comment = new Domain.Entities.TicketComment(tenantId, ticketId, authorId, body, isInternal);
        _dbContext.TicketComments.Add(comment);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return MapComment(comment);
    }

    private async Task<string> NextTicketNumberAsync(Guid tenantId, CancellationToken cancellationToken)
    {
        var count = await _dbContext.Tickets
            .IgnoreQueryFilters()
            .CountAsync(t => t.TenantId == tenantId, cancellationToken);

        return $"TKT-{(count + 1).ToString().PadLeft(4, '0')}";
    }

    private async Task<TicketEntity> FindAsync(
        Guid tenantId,
        Guid ticketId,
        bool tracking,
        CancellationToken cancellationToken)
    {
        var query = _dbContext.Tickets.IgnoreQueryFilters().AsQueryable();
        if (!tracking)
        {
            query = query.AsNoTracking();
        }

        var ticket = await query.FirstOrDefaultAsync(
            t => t.Id == ticketId && t.TenantId == tenantId && !t.IsDeleted && t.Status == EntityStatus.Active,
            cancellationToken);

        return ticket ?? throw new NotFoundException("Ticket was not found.");
    }

    private static bool TryParseStatus(string value, out TicketStatus status) =>
        Enum.TryParse(value, ignoreCase: true, out status);

    private static bool TryParsePriority(string value, out TicketPriority priority) =>
        Enum.TryParse(value, ignoreCase: true, out priority);

    private static TicketDto Map(TicketEntity ticket) =>
        new(
            ticket.Id,
            ticket.TenantId,
            ticket.TicketNumber,
            ticket.CustomerId,
            ticket.ConversationId,
            ticket.Subject,
            ticket.Description,
            ticket.Priority.ToString(),
            ticket.TicketStatus.ToString(),
            ticket.AssigneeId,
            ticket.CreatedAt,
            ticket.UpdatedAt);

    private static TicketCommentDto MapComment(Domain.Entities.TicketComment comment) =>
        new(
            comment.Id,
            comment.TicketId,
            comment.TenantId,
            comment.AuthorId,
            comment.Body,
            comment.IsInternal,
            comment.CreatedAt);
}
