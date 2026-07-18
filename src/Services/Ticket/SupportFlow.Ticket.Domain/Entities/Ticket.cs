using SupportFlow.Shared.Kernel.Entities;
using SupportFlow.Shared.Kernel.Interfaces;
using SupportFlow.Ticket.Domain.Enums;

namespace SupportFlow.Ticket.Domain.Entities;

public class Ticket : AuditableEntity, ITenantEntity
{
    private Ticket()
    {
    }

    public Ticket(
        Guid tenantId,
        Guid customerId,
        string subject,
        string ticketNumber,
        string? description = null,
        TicketPriority priority = TicketPriority.Medium,
        Guid? conversationId = null,
        Guid? assigneeId = null)
    {
        TenantId = tenantId;
        CustomerId = customerId;
        ConversationId = conversationId;
        Subject = subject.Trim();
        Description = string.IsNullOrWhiteSpace(description) ? null : description.Trim();
        Priority = priority;
        TicketStatus = TicketStatus.New;
        AssigneeId = assigneeId;
        TicketNumber = ticketNumber;
    }

    public Guid TenantId { get; set; }
    public Guid? ConversationId { get; set; }
    public Guid CustomerId { get; set; }
    public string TicketNumber { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string? Description { get; set; }
    public TicketPriority Priority { get; set; }
    public TicketStatus TicketStatus { get; set; }
    public Guid? AssigneeId { get; set; }

    public ICollection<TicketComment> Comments { get; set; } = new List<TicketComment>();

    public void ApplyUpdate(
        string? subject,
        string? description,
        TicketPriority? priority,
        TicketStatus? status,
        Guid? assigneeId,
        bool clearAssignee)
    {
        if (!string.IsNullOrWhiteSpace(subject))
        {
            Subject = subject.Trim();
        }

        if (description is not null)
        {
            Description = string.IsNullOrWhiteSpace(description) ? null : description.Trim();
        }

        if (priority is not null)
        {
            Priority = priority.Value;
        }

        if (status is not null)
        {
            TicketStatus = status.Value;
        }

        if (clearAssignee)
        {
            AssigneeId = null;
        }
        else if (assigneeId is not null)
        {
            AssigneeId = assigneeId;
        }

        UpdatedAt = DateTime.UtcNow;
    }
}
