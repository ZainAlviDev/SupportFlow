using SupportFlow.Shared.Kernel.Entities;
using SupportFlow.Shared.Kernel.Interfaces;

namespace SupportFlow.Ticket.Domain.Entities;

public class TicketComment : BaseEntity, ITenantEntity
{
    private TicketComment()
    {
    }

    public TicketComment(
        Guid tenantId,
        Guid ticketId,
        Guid authorId,
        string body,
        bool isInternal = false)
    {
        TenantId = tenantId;
        TicketId = ticketId;
        AuthorId = authorId;
        Body = body.Trim();
        IsInternal = isInternal;
        CreatedAt = DateTime.UtcNow;
    }

    public Guid TenantId { get; set; }
    public Guid TicketId { get; set; }
    public Guid AuthorId { get; set; }
    public string Body { get; set; } = string.Empty;
    public bool IsInternal { get; set; }
    public DateTime CreatedAt { get; set; }

    public Ticket? Ticket { get; set; }
}
